export function exitAfterFlush(): void {
  process.stderr.write('', () => {
    process.stdout.write('', () => process.exit());
  });
}
