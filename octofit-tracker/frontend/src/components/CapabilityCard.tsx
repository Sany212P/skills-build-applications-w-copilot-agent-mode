import { useEffect, useState, type ReactNode } from 'react';

type Props<T> = {
  title: string;
  description: string;
  emptyMessage: string;
  loadItems: () => Promise<T[]>;
  renderItem: (item: T) => ReactNode;
};

export function CapabilityCard<T>({ title, description, emptyMessage, loadItems, renderItem }: Props<T>) {
  const [items, setItems] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.resolve()
      .then(loadItems)
      .then((result) => {
        if (active) setItems(result);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Unexpected error');
      });
    return () => {
      active = false;
    };
  }, [loadItems]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {error !== null ? (
          <p role="alert">Unable to load {title.toLowerCase()}: {error}</p>
        ) : items === null ? (
          <p role="status">Loading {title.toLowerCase()}...</p>
        ) : items.length === 0 ? (
          <p>{emptyMessage}</p>
        ) : (
          <ul className="list-unstyled mb-0">
            {items.map((item, index) => <li key={index}>{renderItem(item)}</li>)}
          </ul>
        )}
      </div>
    </section>
  );
}
