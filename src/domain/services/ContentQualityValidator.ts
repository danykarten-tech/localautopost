import { Concept } from '../models/types';

export interface QualityReport {
  qualityScore: number;
  qualityIssues: string[];
  status: 'VALID' | 'WARNING' | 'ERROR';
}

export class ContentQualityValidator {
  public static validateConcept(
    concept: Partial<Concept>, 
    existingConcepts: Partial<Concept>[] = [],
    forbiddenKeywords: string[] = []
  ): QualityReport {
    const issues: string[] = [];
    let score = 100;

    // Title validation
    if (!concept.title || concept.title.trim().length < 5) {
      score -= 20;
      issues.push('Empty or short title.');
    }

    // Hook validation
    if (!concept.hook || concept.hook.trim().length < 15) {
      score -= 15;
      issues.push('Hook needs to be more compelling.');
    }

    // Caption validation
    if (!concept.fullCaption || concept.fullCaption.trim().length < 40) {
      score -= 15;
      issues.push('Caption text is sparse.');
    } else if (concept.fullCaption.length > 2200) {
      score -= 15;
      issues.push('Excessive caption length exceeds 2,200 character platform limit.');
    }

    // CTA check
    if (!concept.cta || concept.cta.trim().length < 5) {
      score -= 10;
      issues.push('Missing or weak Call-to-Action (CTA).');
    }

    // Hashtags check
    if (!concept.hashtags || concept.hashtags.length < 3) {
      score -= 10;
      issues.push('Add at least 3 relevant hashtags.');
    } else if (concept.hashtags.length > 30) {
      score -= 10;
      issues.push('Hashtag count exceeds 30 tag platform limit.');
    }

    // Forbidden Keywords check from Brand Kit
    if (forbiddenKeywords.length > 0) {
      const fullText = `${concept.title || ''} ${concept.hook || ''} ${concept.fullCaption || ''}`.toLowerCase();
      for (const kw of forbiddenKeywords) {
        if (kw.trim() && fullText.includes(kw.toLowerCase().trim())) {
          score -= 30;
          issues.push(`Contains forbidden brand keyword: "${kw}".`);
        }
      }
    }

    // Uniqueness check (Duplicate prevention against existing concepts)
    if (concept.title && existingConcepts.some(e => e.id !== concept.id && e.title?.toLowerCase() === concept.title?.toLowerCase())) {
      score -= 25;
      issues.push('Duplicate title detected across campaign batch.');
    }

    if (concept.hook && existingConcepts.some(e => e.id !== concept.id && e.hook?.toLowerCase() === concept.hook?.toLowerCase())) {
      score -= 25;
      issues.push('Duplicate hook detected across campaign batch.');
    }

    const finalScore = Math.max(0, Math.min(100, score));
    let status: 'VALID' | 'WARNING' | 'ERROR' = 'VALID';
    if (finalScore < 60 || issues.some(i => i.includes('forbidden') || i.includes('Empty'))) {
      status = 'ERROR';
    } else if (finalScore < 85 || issues.length > 0) {
      status = 'WARNING';
    }

    return {
      qualityScore: finalScore,
      qualityIssues: issues,
      status
    };
  }
}
