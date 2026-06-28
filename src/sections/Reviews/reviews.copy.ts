export type ReviewsSectionCopy = {
  anonymousReviewName: string;
  noRatingLabel: string;

  imagePrevLabel: string;
  imageNextLabel: string;
  imageDotLabelPrefix: string;
  imageCloseLabel: string;
  imageOpenLabel: string;

  clientPrevLabel: string;
  clientNextLabel: string;
  clientDotLabelPrefix: string;
  moreLabel: string;
  collapseLabel: string;

  loadError: string;
  leaveReviewLabel: string;
  loadingLabel: string;
  emptyLabel: string;
  errorLabel: string;
  formLinkHint: string;
};

export const reviewsCopyByLanguage: Record<"ru" | "en", ReviewsSectionCopy> = {
  ru: {
    anonymousReviewName: "Анонимный отзыв",
    noRatingLabel: "Без оценки",

    imagePrevLabel: "Предыдущие отзывы",
    imageNextLabel: "Следующие отзывы",
    imageDotLabelPrefix: "Перейти к слайду",
    imageCloseLabel: "Закрыть просмотр",
    imageOpenLabel: "Открыть отзыв крупнее",

    clientPrevLabel: "Предыдущие отзывы",
    clientNextLabel: "Следующие отзывы",
    clientDotLabelPrefix: "Перейти к отзывам",
    moreLabel: "Ещё",
    collapseLabel: "Свернуть",

    loadError: "Не удалось загрузить отзывы.",
    leaveReviewLabel: "Оставить отзыв",
    loadingLabel: "Загружаем отзывы...",
    emptyLabel: "Станьте первым, кто оставит отзыв!",
    errorLabel: "Отзывы временно не удалось загрузить.",
    formLinkHint:
      "Уже были на консультации? Можно оставить отзыв — он попадёт специалисту на проверку.",
  },

  en: {
    anonymousReviewName: "Anonymous review",
    noRatingLabel: "No rating",

    imagePrevLabel: "Previous reviews",
    imageNextLabel: "Next reviews",
    imageDotLabelPrefix: "Go to slide",
    imageCloseLabel: "Close preview",
    imageOpenLabel: "Open review larger",

    clientPrevLabel: "Previous reviews",
    clientNextLabel: "Next reviews",
    clientDotLabelPrefix: "Go to reviews",
    moreLabel: "More",
    collapseLabel: "Collapse",

    loadError: "Failed to load reviews.",
    leaveReviewLabel: "Leave a review",
    loadingLabel: "Loading reviews...",
    emptyLabel: "Be the first to leave a review!",
    errorLabel: "Reviews could not be loaded right now.",
    formLinkHint:
      "Already had a session? You can leave a review for moderation.",
  },
};