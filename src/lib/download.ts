/** Blob을 파일로 저장(브라우저 다운로드 트리거). */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // click은 다운로드를 비동기로 트리거하므로 다음 틱에 URL을 정리한다.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
