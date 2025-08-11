import type { AnalysisResult } from '@wooordle/ocr';

export interface ApiResponse extends AnalysisResult {
  error?: string;
}
