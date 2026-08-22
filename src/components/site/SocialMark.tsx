import type { SocialLink } from '../../data/site';

export default function SocialMark({ kind }: { kind: SocialLink['kind'] }) {
  const label = kind === 'vk' ? 'VK' : kind === 'telegram' ? 'T' : 'W';
  return <span className={`social-mark social-mark--${kind}`} aria-hidden="true">{label}</span>;
}
