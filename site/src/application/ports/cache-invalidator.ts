export interface CacheInvalidator {
  invalidateQuestion(number: number): void;
  invalidateLists(): void;
}
