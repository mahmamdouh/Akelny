import { useLocalization } from '../hooks/useLocalization';

export interface HelpContent {
  type: 'text' | 'list' | 'colorCode';
  content: string | string[] | ColorCodeItem[];
}

export interface ColorCodeItem {
  color: string;
  label: string;
  description: string;
}

export interface HelpTopic {
  id: string;
  title: string;
  content: HelpContent[];
}

export const useHelpContent = () => {
  const { t } = useLocalization();

  const getIngredientStatusHelp = (): HelpTopic => ({
    id: 'ingredient-status',
    title: t('help.ingredientStatus.title'),
    content: [
      {
        type: 'text',
        content: t('help.ingredientStatus.description'),
      },
      {
        type: 'colorCode',
        content: [
          {
            color: '#4CAF50',
            label: t('help.ingredientStatus.mandatory.label'),
            description: t('help.ingredientStatus.mandatory.description'),
          },
          {
            color: '#FF9800',
            label: t('help.ingredientStatus.recommended.label'),
            description: t('help.ingredientStatus.recommended.description'),
          },
          {
            color: '#9E9E9E',
            label: t('help.ingredientStatus.optional.label'),
            description: t('help.ingredientStatus.optional.description'),
          },
        ],
      },
      {
        type: 'text',
        content: t('help.ingredientStatus.usage'),
      },
    ],
  });

  const getMealSuggestionHelp = (): HelpTopic => ({
    id: 'meal-suggestions',
    title: t('help.mealSuggestions.title'),
    content: [
      {
        type: 'text',
        content: t('help.mealSuggestions.description'),
      },
      {
        type: 'list',
        content: [
          t('help.mealSuggestions.steps.pantry'),
          t('help.mealSuggestions.steps.mealType'),
          t('help.mealSuggestions.steps.kitchen'),
          t('help.mealSuggestions.steps.suggest'),
        ],
      },
      {
        type: 'text',
        content: t('help.mealSuggestions.tips'),
      },
    ],
  });

  const getPantryManagementHelp = (): HelpTopic => ({
    id: 'pantry-management',
    title: t('help.pantryManagement.title'),
    content: [
      {
        type: 'text',
        content: t('help.pantryManagement.description'),
      },
      {
        type: 'list',
        content: [
          t('help.pantryManagement.features.search'),
          t('help.pantryManagement.features.categories'),
          t('help.pantryManagement.features.status'),
          t('help.pantryManagement.features.sync'),
        ],
      },
    ],
  });

  const getCalendarHelp = (): HelpTopic => ({
    id: 'calendar',
    title: t('help.calendar.title'),
    content: [
      {
        type: 'text',
        content: t('help.calendar.description'),
      },
      {
        type: 'list',
        content: [
          t('help.calendar.features.save'),
          t('help.calendar.features.plan'),
          t('help.calendar.features.avoid'),
          t('help.calendar.features.view'),
        ],
      },
    ],
  });

  const getRecipeCreationHelp = (): HelpTopic => ({
    id: 'recipe-creation',
    title: t('help.recipeCreation.title'),
    content: [
      {
        type: 'text',
        content: t('help.recipeCreation.description'),
      },
      {
        type: 'list',
        content: [
          t('help.recipeCreation.steps.basic'),
          t('help.recipeCreation.steps.ingredients'),
          t('help.recipeCreation.steps.instructions'),
          t('help.recipeCreation.steps.nutrition'),
          t('help.recipeCreation.steps.share'),
        ],
      },
    ],
  });

  return {
    getIngredientStatusHelp,
    getMealSuggestionHelp,
    getPantryManagementHelp,
    getCalendarHelp,
    getRecipeCreationHelp,
  };
};