import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

export class GenerationQueue extends EventEmitter {
  constructor() {
    super();
    this.queue = [];
    this.processing = false;
    this.jobs = new Map();
    this.persistPath = './data/jobs';
  }

  async init() {
    // Créer le dossier de persistence
    await fs.mkdir(this.persistPath, { recursive: true });

    // Restaurer les jobs non terminés
    await this.restoreJobs();

    // Démarrer le processing
    this.startProcessing();
  }

  async addJob(prompt, metadata = {}) {
    const jobId = uuidv4();
    const job = {
      id: jobId,
      prompt,
      metadata,
      status: 'pending',
      progress: 0,
      steps: [],
      result: null,
      error: null,
      createdAt: Date.now(),
      startedAt: null,
      completedAt: null
    };

    // Sauvegarder immédiatement sur disque
    await this.saveJob(job);

    // Ajouter à la queue
    this.jobs.set(jobId, job);
    this.queue.push(jobId);

    // Émettre l'événement
    this.emit('job:created', job);

    // Démarrer le processing si pas déjà en cours
    if (!this.processing) {
      this.startProcessing();
    }

    return jobId;
  }

  async getJob(jobId) {
    // D'abord vérifier en mémoire
    if (this.jobs.has(jobId)) {
      return this.jobs.get(jobId);
    }

    // Sinon charger depuis le disque
    try {
      const data = await fs.readFile(
        path.join(this.persistPath, `${jobId}.json`),
        'utf-8'
      );
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  async updateJob(jobId, updates) {
    const job = await this.getJob(jobId);
    if (!job) return null;

    // Mettre à jour
    Object.assign(job, updates);

    // Sauvegarder
    await this.saveJob(job);

    // Émettre l'événement
    this.emit('job:updated', job);

    return job;
  }

  async saveJob(job) {
    const filePath = path.join(this.persistPath, `${job.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(job, null, 2));
  }

  async restoreJobs() {
    try {
      const files = await fs.readdir(this.persistPath);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const data = await fs.readFile(
            path.join(this.persistPath, file),
            'utf-8'
          );
          const job = JSON.parse(data);

          // Restaurer les jobs non terminés
          if (job.status === 'pending' || job.status === 'processing') {
            this.jobs.set(job.id, job);
            this.queue.push(job.id);
            console.log(`📥 Restored job: ${job.id}`);
          }
        }
      }
    } catch (error) {
      console.log('No previous jobs to restore');
    }
  }

  async startProcessing() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const jobId = this.queue.shift();
      await this.processJob(jobId);
    }

    this.processing = false;
  }

  async processJob(jobId) {
    const job = await this.getJob(jobId);
    if (!job) return;

    try {
      // Marquer comme en cours
      await this.updateJob(jobId, {
        status: 'processing',
        startedAt: Date.now(),
        progress: 0
      });

      // Importer le processeur
      const { StreamingGenerator } = await import('./streaming-generator.js');
      const generator = new StreamingGenerator();

      // Écouter les événements de progression
      generator.on('progress', async (data) => {
        await this.updateJob(jobId, {
          progress: data.progress,
          steps: [...(job.steps || []), data.step]
        });
      });

      // Lancer la génération
      const result = await generator.generate(job.prompt, job.metadata);

      // Sauvegarder le résultat
      await this.updateJob(jobId, {
        status: 'completed',
        result,
        progress: 100,
        completedAt: Date.now()
      });

      this.emit('job:completed', await this.getJob(jobId));

    } catch (error) {
      console.error(`Job ${jobId} failed:`, error);

      await this.updateJob(jobId, {
        status: 'failed',
        error: error.message,
        completedAt: Date.now()
      });

      this.emit('job:failed', await this.getJob(jobId));
    }
  }
}