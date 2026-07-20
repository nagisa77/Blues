export const SOURCE_PATHS = {
  recordings: '录音/README.md',
  logs: '日志/*.md',
  songs: '曲目/曲目看板.md',
  progress: '进度/进度看板.md',
}

export const KNOWN_SONGS = [
  {
    id: 'key-to-the-highway',
    artist: 'Derek and the Dominos',
    title: 'Key to the Highway',
    matches: [/Key to the Highway/i, /KeyToTheHighway/i],
  },
  {
    id: 'call-it-stormy-monday',
    artist: 'T-Bone Walker',
    title: 'Call It Stormy Monday',
    matches: [/Call It Stormy Monday/i, /CallItStormyMonday/i],
  },
  {
    id: 'he-ni-zai-yi-qi',
    artist: null,
    title: '和你在一起',
    matches: [/和你在一起/],
  },
  {
    id: 'born-under-a-bad-sign',
    artist: 'Albert King',
    title: 'Born Under a Bad Sign',
    matches: [/Born Under a Bad Sign/i, /Born_Under_A_Bad_Sign/i],
  },
  {
    id: 'the-thrill-is-gone',
    artist: 'B.B. King',
    title: 'The Thrill Is Gone',
    matches: [/The Thrill Is Gone/i, /TheThrillIsGone/i],
  },
  {
    id: 'before-you-accuse-me',
    artist: 'Eric Clapton',
    title: 'Before You Accuse Me',
    matches: [/Before You Accuse Me/i, /BeforeYouAccuseMe/i],
  },
  {
    id: 'hide-away',
    artist: 'Freddie King',
    title: 'Hide Away',
    matches: [/Hide Away/i, /HideAway/i],
  },
  {
    id: 'how-blue-can-you-get',
    artist: 'B.B. King',
    title: 'How Blue Can You Get?',
    matches: [/How Blue Can You Get/i, /HowBlueCanYouGet/i],
  },
]

export const WEEK_ORDINALS = new Map([
  ['一', 1],
  ['二', 2],
  ['三', 3],
  ['四', 4],
  ['五', 5],
  ['六', 6],
  ['七', 7],
  ['八', 8],
])
