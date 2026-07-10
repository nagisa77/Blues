const REPOSITORY = 'nagisa77/Blues'
const BRANCH = 'main'

export const encodeRepositoryPath = (path: string) =>
  path
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')

export const githubRawUrl = (path: string) =>
  `https://raw.githubusercontent.com/${REPOSITORY}/${BRANCH}/${encodeRepositoryPath(path)}`

export const githubFileUrl = (path: string) =>
  `https://github.com/${REPOSITORY}/blob/${BRANCH}/${encodeRepositoryPath(path)}`

export const githubTreeUrl = (path: string) =>
  `https://github.com/${REPOSITORY}/tree/${BRANCH}/${encodeRepositoryPath(path)}`
