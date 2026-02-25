export const categories = [
  { id: 'learning-resource', name: 'Learning Resource', icon: '🎓', description: 'Educational materials' },
  { id: 'non-fiction', name: 'Non Fiction', icon: '📚', description: 'Real-world knowledge' },
  { id: 'story', name: 'Story', icon: '📝', description: 'Captivating tales' },
  { id: 'fiction', name: 'Fiction', icon: '📖', description: 'Imaginative stories' },
  { id: 'sports', name: 'Sports', icon: '⚽', description: 'Athletic adventures' },
  { id: 'biography', name: 'Biography', icon: '👤', description: 'Life stories' },
] as const;

export type CategoryId = typeof categories[number]['id'];
