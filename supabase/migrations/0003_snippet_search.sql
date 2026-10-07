-- =====================================================================
-- DevMentor AI — 0003 snippet full-text search
-- Maintains snippets.search_tsv (title^A, desc/lang/category/tags^B,
-- notes^C) via trigger + a GIN index. Query from the API with
-- websearch_to_tsquery('english', :q).
-- =====================================================================

create or replace function public.snippets_tsv_update()
returns trigger language plpgsql as $$
declare
  tag_text text;
begin
  select coalesce(string_agg(value, ' '), '')
    into tag_text
    from jsonb_array_elements_text(coalesce(new.tags, '[]'::jsonb));

  new.search_tsv :=
      setweight(to_tsvector('english', coalesce(new.title, '')), 'A')
    || setweight(to_tsvector('english',
         coalesce(new.description, '') || ' ' ||
         coalesce(new.language, '')    || ' ' ||
         coalesce(new.category, '')    || ' ' ||
         tag_text), 'B')
    || setweight(to_tsvector('english', coalesce(new.notes, '')), 'C');
  return new;
end;
$$;

drop trigger if exists snippets_tsv on public.snippets;
create trigger snippets_tsv
  before insert or update on public.snippets
  for each row execute function public.snippets_tsv_update();

create index if not exists snippets_search_idx
  on public.snippets using gin(search_tsv);

-- Backfill any rows inserted before the trigger existed.
update public.snippets set updated_at = updated_at;
