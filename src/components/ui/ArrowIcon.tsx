export default function ArrowIcon({ direction = 'right' }: { direction?: 'left' | 'right' }) {
  return <span aria-hidden="true">{direction === 'right' ? '→' : '←'}</span>;
}
