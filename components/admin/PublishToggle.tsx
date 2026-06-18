'use client';

import React, {useState} from 'react';
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {useTranslations} from "next-intl";
import {togglePublishStatus} from "@/services/db/admin/togglePublishStatus";

interface PublishToggleProps {
  recipeId: string;
  isPublished: boolean;
}

const PublishToggle: React.FC<PublishToggleProps> = ({recipeId, isPublished}) => {
  const t = useTranslations('admin');
  const queryClient = useQueryClient();

  // Optimistic local state, reconciled with the server value after the mutation settles.
  const [checked, setChecked] = useState(isPublished);

  const {mutate, isPending} = useMutation({
    mutationFn: (next: boolean) => togglePublishStatus(recipeId, next),
    onMutate: (next) => {
      const previous = checked;
      setChecked(next);
      return {previous};
    },
    onError: (_error, _next, context) => {
      if (context) setChecked(context.previous);
    },
    onSuccess: (data) => {
      setChecked(data.isPublished);
    },
    onSettled: () => {
      // Refetch the admin list so search results and counts stay in sync.
      queryClient.invalidateQueries({queryKey: ['recipes']});
    },
  });

  return (
    <div className="flex items-center justify-between gap-2">
      <span
        className={`text-xs uppercase tracking-wider ${checked ? 'text-green-600' : 'text-muted'}`}
      >
        {checked ? t('list.published') : t('list.draft')}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={checked ? t('list.unpublish') : t('list.publish')}
        disabled={isPending}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          mutate(!checked);
        }}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
          checked ? 'bg-green-600' : 'bg-border'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
};

export default React.memo(PublishToggle);