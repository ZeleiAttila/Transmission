import ErrorWithCode from "./errorWithCode";

async function downloadFileFromUrl(url) {
  if (!/^(blob|https?):/.test(url)) {
    throw new ErrorWithCode('Link is not supported', 'LINK_IS_NOT_SUPPORTED');
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new ErrorWithCode(`${response.status}: ${response.statusText}`, 'RESPONSE_IS_NOT_OK');
  }
  const sizeHeader = response.headers.get('Content-Length');
  const MAX = 10 * 1024 * 1024;
  if (sizeHeader && Number(sizeHeader) > MAX) {
    throw new ErrorWithCode('Size is more then 10mb', 'FILE_SIZE_EXCEEDED');
  }
  const blob = await response.blob();
  if (typeof url === 'string' && url.startsWith('blob:')) {
    const U = (typeof self !== 'undefined' ? self.URL : (typeof URL !== 'undefined' ? URL : null));
    if (U && typeof U.revokeObjectURL === 'function') {
      U.revokeObjectURL(url);
    }
  }
  return { blob };
}

export default downloadFileFromUrl;