import type { AnalysisResult } from '@wooordle/ocr';

export interface ApiResponse {
  analysisResult?: AnalysisResult;
  error?: string;
}
