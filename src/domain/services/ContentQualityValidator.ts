import { Concept } from '../models/types';

export interface QualityReport {
  qualityScore: number;
  qualityIssues: string[];
}

export class ContentQualityValidator {
  public static validateConcept(concept: Partial<Concept>, existingConcepts: Partial<Concept>[] = []): QualityReport {
    const issues: string[] = [];
    let score = 100;

    // Title validation
    if (!concept.title || concept.title.trim().length < 5) {
      score -= 15;
      issues.push('Title is too short or missing.');
    }

    // Hook validation
    if (!concept.hook || concept.hook.trim().length < 15) {
      score -= 15;
      issues.push('Hook needs to be more compelling and detailed.');
    }

    // Caption validation
    if (!concept.fullCaption || concept.fullCaption.trim().length < 40) {
      score -= 15;
      issues.push('Caption is sparse; consider expanding details.');
    }

    // CTA check
    if (!concept.cta || concept.cta.trim().length < 5) {
      score -= 10;
      issues.push('Call-to-action (CTA) could be stronger.');
    }

    // Hashtags check
    if (!concept.hashtags || concept.hashtags.length < 3) {
      score -= 10;
      issues.push('Add at least 3 relevant hashtags for visibility.');
    }

    // Uniqueness check (Duplicate prevention against existing concepts)
    if (concept.title && existingConcepts.some(e => e.id !== concept.id && e.title?.toLowerCase() === concept.title?.toLowerCase())) {
      score -= 25;
      issues.push('Similar title concept already exists in campaign.');
    }

    if (concept.hook && existingConcepts.some(e => e.id !== concept.id && e.hook?.toLowerCase() === concept.hook?.toLowerCase())) {
      score -= 25;
      issues.push('Duplicate hook detected across campaign.');
    }

    const finalScore = Math.max(0, Math.min(100, score));

    return {
      qualityScore: finalScore,
      qualityIssues: issues
    };
  }
}
