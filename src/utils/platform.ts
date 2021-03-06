import path from "node:path"

/**
 * Gets the plaform form a given file name.
 * @param fileName fileName with extension
 * @returns fully qualified extension or an empty string.
 */
export function checkPlatform (fileName: string) {
  const extension = path.extname(fileName).slice(1)
  const arch = (fileName.includes('arm64') || fileName.includes('aarch64')) ? '_arm64' : ''

  if (
    (fileName.includes('mac') || fileName.includes('darwin')) &&
    extension === 'zip'
  ) {
    return 'darwin' + arch
  }

  const directCache = ['exe', 'dmg', 'rpm', 'deb', 'AppImage']
  return directCache.includes(extension) ? (extension + arch) : ''
}
