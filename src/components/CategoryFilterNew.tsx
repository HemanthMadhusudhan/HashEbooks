import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { categories } from '@/data/categories';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CategoryFilterNewProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

function CategoryButton({
  selected,
  onClick,
  icon,
  label,
  index = 0
}: {
  selected: boolean;
  onClick: () => void;
  icon?: string;
  label: string;
  index?: number;
}) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ scale: 1.08, y: -2 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "relative px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 shrink-0 overflow-hidden",
        selected
          ? "text-primary-foreground shadow-sm"
          : "glass-card hover:bg-secondary/50 text-foreground/80 hover:text-foreground"
      )}
    >
      {selected && (
        <motion.div
          layoutId="activeCategory"
          className="absolute inset-0 rounded-xl bg-primary"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}

      <span className="relative z-10 flex items-center gap-1.5">
        {icon && (
          <motion.span
            animate={selected ? { rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.5 }}
          >
            {icon}
          </motion.span>
        )}
        {label}
      </span>
    </motion.button>
  );
}

export function CategoryFilterNew({ selectedCategory, onCategoryChange }: CategoryFilterNewProps) {
  return (
    <motion.section
      className="py-6 glass border-b border-border/30 relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Mobile: horizontal scroll */}
      <div className="md:hidden relative z-10">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-3 pb-2 px-4">
            <CategoryButton
              selected={selectedCategory === null}
              onClick={() => onCategoryChange(null)}
              icon="📚"
              label="All Books"
              index={0}
            />

            {categories.map((category, index) => (
              <CategoryButton
                key={category.id}
                selected={selectedCategory === category.id}
                onClick={() => onCategoryChange(category.id)}
                icon={category.icon}
                label={category.name}
                index={index + 1}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      </div>

      {/* Desktop: centered */}
      <div className="hidden md:flex justify-center relative z-10">
        <div className="flex gap-3 flex-wrap justify-center px-4">
          <CategoryButton
            selected={selectedCategory === null}
            onClick={() => onCategoryChange(null)}
            icon="📚"
            label="All Books"
            index={0}
          />

          {categories.map((category, index) => (
            <CategoryButton
              key={category.id}
              selected={selectedCategory === category.id}
              onClick={() => onCategoryChange(category.id)}
              icon={category.icon}
              label={category.name}
              index={index + 1}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
}
