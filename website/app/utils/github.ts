import { SITE } from '~/config/site'

export const encodeRepositoryPath = (path: string) =>
  path
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')

export const githubRawUrl = (path: string) =>
  `https://raw.githubusercontent.com/${SITE.repository}/${SITE.branch}/${encodeRepositoryPath(path)}`

export const githubFileUrl = (path: string) =>
  `${SITE.repositoryUrl}/blob/${SITE.branch}/${encodeRepositoryPath(path)}`
