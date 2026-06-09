import { useCallback, useEffect, useMemo, useState } from "react";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminFeedback } from "../../../components/admin/AdminFeedback";
import { AdminFiltersRow } from "../../../components/admin/AdminFiltersRow";
import { AdminSection } from "../../../components/admin/AdminSection";
import {
    getAdminClientReviewsPage,
    resetAdminClientReviewOrder,
    updateAdminClientReview,
    updateAdminClientReviewOrder,
} from "../../../lib/api/adminClients";
import type {
    ClientReviewAdminRecord,
    ClientReviewStatus,
} from "../../../types/reviews";
import { AdminReviewsTable, type ReviewOrderAction } from "./AdminReviewsTable";
import styles from "./AdminReviewsPage.module.css";

const REVIEW_PAGE_SIZE = 10;

function getReviewPreviewLimit(width: number): number {
    if (width <= 640) {
        return 80;
    }

    if (width <= 700) {
        return 100;
    }

    if (width <= 800) {
        return 120;
    }

    if (width <= 900) {
        return 150;
    }

    if (width <= 1000) {
        return 170;
    }

    if (width <= 1100) {
        return 200;
    }

    if (width <= 1280) {
        return 250;
    }

    return 350;
}

function useReviewPreviewLimit(): number {
    const [previewLimit, setPreviewLimit] = useState(() => {
        if (typeof window === "undefined") {
            return 350;
        }

        return getReviewPreviewLimit(window.innerWidth);
    });

    useEffect(() => {
        const handleResize = () => {
            setPreviewLimit(getReviewPreviewLimit(window.innerWidth));
        };

        handleResize();

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return previewLimit;
}

function upsertReview(
    items: ClientReviewAdminRecord[],
    item: ClientReviewAdminRecord
): ClientReviewAdminRecord[] {
    const withoutItem = items.filter((currentItem) => currentItem.id !== item.id);

    return [item, ...withoutItem];
}

function removeReview(
    items: ClientReviewAdminRecord[],
    itemId: number
): ClientReviewAdminRecord[] {
    return items.filter((currentItem) => currentItem.id !== itemId);
}

function getManualPublishedOrderIds(
    items: ClientReviewAdminRecord[]
): number[] {
    return items
        .filter(
            (item) => item.status === "published" && item.publicOrder !== null
        )
        .sort((firstItem, secondItem) => {
            const firstOrder = firstItem.publicOrder ?? Number.MAX_SAFE_INTEGER;
            const secondOrder = secondItem.publicOrder ?? Number.MAX_SAFE_INTEGER;

            return firstOrder - secondOrder;
        })
        .map((item) => item.id);
}

function swapItems<T>(items: T[], fromIndex: number, toIndex: number): T[] {
    const nextItems = [...items];
    const fromItem = nextItems[fromIndex];
    const toItem = nextItems[toIndex];

    nextItems[fromIndex] = toItem;
    nextItems[toIndex] = fromItem;

    return nextItems;
}

export function AdminReviewsPage() {
    const previewLimit = useReviewPreviewLimit();

    const [pendingItems, setPendingItems] = useState<ClientReviewAdminRecord[]>(
        []
    );
    const [publishedItems, setPublishedItems] = useState<
        ClientReviewAdminRecord[]
    >([]);
    const [hiddenItems, setHiddenItems] = useState<ClientReviewAdminRecord[]>([]);

    const [isPendingLoading, setIsPendingLoading] = useState(true);
    const [isPublishedLoading, setIsPublishedLoading] = useState(false);
    const [isHiddenLoading, setIsHiddenLoading] = useState(false);
    const [isReviewOrderUpdating, setIsReviewOrderUpdating] = useState(false);

    const [isPublishedOpen, setIsPublishedOpen] = useState(false);
    const [isHiddenOpen, setIsHiddenOpen] = useState(false);

    const [publishedHasMore, setPublishedHasMore] = useState(false);
    const [publishedDefaultItemsCount, setPublishedDefaultItemsCount] = useState(0);
    const [hiddenHasMore, setHiddenHasMore] = useState(false);

    const [adminNoteDrafts, setAdminNoteDrafts] = useState<
        Record<number, string>
    >({});
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

    const pendingCount = pendingItems.length;

    const visibleItemsCount = useMemo(
        () =>
            pendingItems.length +
            (isPublishedOpen ? publishedItems.length : 0) +
            (isHiddenOpen ? hiddenItems.length : 0),
        [
            hiddenItems.length,
            isHiddenOpen,
            isPublishedOpen,
            pendingItems.length,
            publishedItems.length,
        ]
    );

    const mergeAdminNoteDrafts = useCallback(
        (loadedItems: ClientReviewAdminRecord[]) => {
            setAdminNoteDrafts((currentDrafts) => {
                const nextDrafts = { ...currentDrafts };

                loadedItems.forEach((item) => {
                    nextDrafts[item.id] = item.adminNote;
                });

                return nextDrafts;
            });
        },
        []
    );

    const loadPendingReviews = useCallback(async () => {
        setIsPendingLoading(true);
        setError("");
        setSuccessMessage("");

        try {
            const result = await getAdminClientReviewsPage({
                status: "pending",
            });

            setPendingItems(result.items);
            mergeAdminNoteDrafts(result.items);
        } catch (loadError) {
            setError(
                loadError instanceof Error
                    ? loadError.message
                    : "Не удалось загрузить отзывы"
            );
        } finally {
            setIsPendingLoading(false);
        }
    }, [mergeAdminNoteDrafts]);

    const loadPublishedReviews = useCallback(
        async (mode: "replace" | "append") => {
            setIsPublishedLoading(true);
            setError("");
            setSuccessMessage("");

            try {
                if (mode === "replace") {
                    const [pinnedResult, defaultResult] = await Promise.all([
                        getAdminClientReviewsPage({
                            status: "published",
                            order: "pinned",
                        }),
                        getAdminClientReviewsPage({
                            status: "published",
                            order: "default",
                            limit: REVIEW_PAGE_SIZE,
                            offset: 0,
                        }),
                    ]);

                    const pinnedIds = new Set(pinnedResult.items.map((item) => item.id));
                    const defaultItems = defaultResult.items.filter(
                        (item) => !pinnedIds.has(item.id)
                    );
                    const nextItems = [...pinnedResult.items, ...defaultItems];

                    setPublishedItems(nextItems);
                    setPublishedDefaultItemsCount(defaultItems.length);
                    setPublishedHasMore(defaultResult.hasMore);
                    mergeAdminNoteDrafts(nextItems);

                    return;
                }

                const result = await getAdminClientReviewsPage({
                    status: "published",
                    order: "default",
                    limit: REVIEW_PAGE_SIZE,
                    offset: publishedDefaultItemsCount,
                });

                setPublishedItems((currentItems) => {
                    const existingIds = new Set(currentItems.map((item) => item.id));
                    const newItems = result.items.filter(
                        (item) => !existingIds.has(item.id)
                    );

                    return [...currentItems, ...newItems];
                });

                setPublishedDefaultItemsCount(
                    (currentCount) => currentCount + result.items.length
                );
                setPublishedHasMore(result.hasMore);
                mergeAdminNoteDrafts(result.items);
            } catch (loadError) {
                setError(
                    loadError instanceof Error
                        ? loadError.message
                        : "Не удалось загрузить опубликованные отзывы"
                );
            } finally {
                setIsPublishedLoading(false);
            }
        },
        [mergeAdminNoteDrafts, publishedDefaultItemsCount]
    );

    const loadHiddenReviews = useCallback(
        async (mode: "replace" | "append") => {
            setIsHiddenLoading(true);
            setError("");
            setSuccessMessage("");

            try {
                const offset = mode === "append" ? hiddenItems.length : 0;

                const result = await getAdminClientReviewsPage({
                    status: "hidden",
                    limit: REVIEW_PAGE_SIZE,
                    offset,
                });

                setHiddenItems((currentItems) =>
                    mode === "append" ? [...currentItems, ...result.items] : result.items
                );
                setHiddenHasMore(result.hasMore);
                mergeAdminNoteDrafts(result.items);
            } catch (loadError) {
                setError(
                    loadError instanceof Error
                        ? loadError.message
                        : "Не удалось загрузить скрытые отзывы"
                );
            } finally {
                setIsHiddenLoading(false);
            }
        },
        [hiddenItems.length, mergeAdminNoteDrafts]
    );

    useEffect(() => {
        void loadPendingReviews();
    }, [loadPendingReviews]);

    const handleRefresh = async () => {
        await loadPendingReviews();

        if (isPublishedOpen) {
            await loadPublishedReviews("replace");
        }

        if (isHiddenOpen) {
            await loadHiddenReviews("replace");
        }
    };

    const handleTogglePublished = () => {
        if (isPublishedOpen) {
            setIsPublishedOpen(false);
            return;
        }

        setIsPublishedOpen(true);

        if (publishedItems.length === 0) {
            void loadPublishedReviews("replace");
        }
    };

    const handleToggleHidden = () => {
        if (isHiddenOpen) {
            setIsHiddenOpen(false);
            return;
        }

        setIsHiddenOpen(true);

        if (hiddenItems.length === 0) {
            void loadHiddenReviews("replace");
        }
    };

    const handleAdminNoteChange = (id: number, value: string) => {
        setAdminNoteDrafts((current) => ({
            ...current,
            [id]: value,
        }));
    };

    const applyUpdatedReview = (updatedItem: ClientReviewAdminRecord) => {
        setPendingItems((currentItems) =>
            updatedItem.status === "pending"
                ? upsertReview(currentItems, updatedItem)
                : removeReview(currentItems, updatedItem.id)
        );

        setPublishedItems((currentItems) => {
            const withoutItem = removeReview(currentItems, updatedItem.id);

            if (updatedItem.status !== "published" || !isPublishedOpen) {
                return withoutItem;
            }

            return upsertReview(withoutItem, updatedItem);
        });

        setHiddenItems((currentItems) => {
            const withoutItem = removeReview(currentItems, updatedItem.id);

            if (updatedItem.status !== "hidden" || !isHiddenOpen) {
                return withoutItem;
            }

            return upsertReview(withoutItem, updatedItem);
        });

        setAdminNoteDrafts((currentDrafts) => ({
            ...currentDrafts,
            [updatedItem.id]: updatedItem.adminNote,
        }));
    };

    const handleUpdateReview = async (
        item: ClientReviewAdminRecord,
        status: ClientReviewStatus
    ) => {
        setUpdatingId(item.id);
        setError("");
        setSuccessMessage("");

        try {
            const updatedItem = await updateAdminClientReview({
                id: item.id,
                status,
                adminNote: adminNoteDrafts[item.id] ?? "",
            });

            applyUpdatedReview(updatedItem);
            setSuccessMessage("Отзыв обновлён.");
        } catch (updateError) {
            setError(
                updateError instanceof Error
                    ? updateError.message
                    : "Не удалось обновить отзыв"
            );
        } finally {
            setUpdatingId(null);
        }
    };

    const savePublishedOrder = async (
        orderedIds: number[],
        message: string
    ) => {
        setIsReviewOrderUpdating(true);
        setError("");
        setSuccessMessage("");

        try {
            if (orderedIds.length === 0) {
                await resetAdminClientReviewOrder();
            } else {
                await updateAdminClientReviewOrder({ orderedIds });
            }

            await loadPublishedReviews("replace");
            setSuccessMessage(message);
        } catch (orderError) {
            setError(
                orderError instanceof Error
                    ? orderError.message
                    : "Не удалось обновить порядок отзывов"
            );
        } finally {
            setIsReviewOrderUpdating(false);
        }
    };

    const handlePublishedOrderAction = async (
        item: ClientReviewAdminRecord,
        action: ReviewOrderAction
    ) => {

        const currentOrderIds = getManualPublishedOrderIds(publishedItems);
        let nextOrderIds = currentOrderIds;

        if (action === "pin") {
            if (currentOrderIds.includes(item.id)) {
                return;
            }

            nextOrderIds = [...currentOrderIds, item.id];
        }

        if (action === "unpin") {
            nextOrderIds = currentOrderIds.filter((reviewId) => reviewId !== item.id);
        }

        if (action === "move-up" || action === "move-down") {
            const currentIndex = currentOrderIds.indexOf(item.id);

            if (currentIndex === -1) {
                return;
            }

            const targetIndex =
                action === "move-up" ? currentIndex - 1 : currentIndex + 1;

            if (targetIndex < 0 || targetIndex >= currentOrderIds.length) {
                return;
            }

            nextOrderIds = swapItems(currentOrderIds, currentIndex, targetIndex);
        }

        const message =
            action === "pin"
                ? "Отзыв закреплён и будет показываться выше обычных отзывов."
                : action === "unpin"
                    ? "Отзыв откреплён и вернётся в обычный порядок."
                    : "Порядок закреплённых отзывов обновлён.";

        await savePublishedOrder(nextOrderIds, message);
    };

    const handleResetPublishedOrder = () => {
        setIsResetConfirmOpen(true);
    };

    const handleCancelResetPublishedOrder = () => {
        if (isReviewOrderUpdating) {
            return;
        }

        setIsResetConfirmOpen(false);
    };

    const handleConfirmResetPublishedOrder = async () => {
        setIsReviewOrderUpdating(true);
        setError("");
        setSuccessMessage("");

        try {
            const message = await resetAdminClientReviewOrder();

            await loadPublishedReviews("replace");
            setSuccessMessage(message);
            setIsResetConfirmOpen(false);
        } catch (resetError) {
            setError(
                resetError instanceof Error
                    ? resetError.message
                    : "Не удалось сбросить порядок отзывов"
            );
        } finally {
            setIsReviewOrderUpdating(false);
        }
    };

    return (
        <main>
            <h1>Отзывы клиентов</h1>

            <div className={styles.summaryBar}>
                <div className={styles.summaryText}>
                    <h2 className={styles.summaryTitle}>Модерация отзывов</h2>
                    <p className={styles.summaryDescription}>
                        Здесь специалист видит, кто оставил отзыв, может проверить текст,
                        опубликовать его на сайте, скрыть или удалить из публичного показа.
                        В первую очередь загружаются отзывы на проверке, а опубликованные и
                        скрытые можно открыть отдельно.
                    </p>
                </div>

                <AdminButton
                    type="button"
                    variant="secondary"
                    onClick={() => void handleRefresh()}
                    disabled={
                        isPendingLoading ||
                        isPublishedLoading ||
                        isHiddenLoading ||
                        isReviewOrderUpdating
                    }
                >
                    {isPendingLoading ? "Обновление..." : "Обновить"}
                </AdminButton>
            </div>

            <AdminFiltersRow>
                <div className={styles.pendingCounter}>
                    На проверке: <strong>{pendingCount}</strong>
                </div>

                <div className={styles.visibleCounter}>
                    Сейчас показано: <strong>{visibleItemsCount}</strong>
                </div>
            </AdminFiltersRow>

            <AdminFeedback message={error} tone="error" />
            <AdminFeedback message={successMessage} tone="success" />

            <AdminSection>
                <div className={styles.reviewsGroupHeader}>
                    <div>
                        <h2 className={styles.reviewsGroupTitle}>Отзывы на проверке</h2>
                        <p className={styles.reviewsGroupDescription}>
                            Новые отзывы, которые ещё не опубликованы на сайте.
                        </p>
                    </div>
                </div>

                {isPendingLoading ? (
                    <p className={styles.mutedText}>Загрузка отзывов...</p>
                ) : pendingItems.length === 0 ? (
                    <p className={styles.mutedText}>
                        Сейчас нет отзывов, ожидающих проверки.
                    </p>
                ) : (
                    <AdminReviewsTable
                        adminNoteDrafts={adminNoteDrafts}
                        items={pendingItems}
                        previewLimit={previewLimit}
                        updatingId={updatingId}
                        onAdminNoteChange={handleAdminNoteChange}
                        onUpdateReview={handleUpdateReview}
                    />
                )}
            </AdminSection>

            <AdminSection>
                <div className={styles.reviewsGroupHeader}>
                    <div>
                        <h2 className={styles.reviewsGroupTitle}>Опубликованные отзывы</h2>
                        <p className={styles.reviewsGroupDescription}>
                            Отзывы, которые уже показываются на публичной странице. Закреплённые
                            отзывы идут первыми, остальные — в обычном порядке.
                        </p>
                    </div>

                    <div className={styles.reviewsGroupActions}>
                        {isPublishedOpen ? (
                            <AdminButton
                                type="button"
                                variant="danger"
                                onClick={handleResetPublishedOrder}
                                disabled={
                                    isPublishedLoading ||
                                    isReviewOrderUpdating ||
                                    publishedItems.length === 0
                                }
                            >
                                {isReviewOrderUpdating ? "Сохранение..." : "Сбросить порядок"}
                            </AdminButton>
                        ) : null}

                        <AdminButton
                            type="button"
                            variant="secondary"
                            onClick={handleTogglePublished}
                            disabled={isPublishedLoading || isReviewOrderUpdating}
                        >
                            {isPublishedOpen
                                ? "Скрыть опубликованные"
                                : "Показать опубликованные"}
                        </AdminButton>
                    </div>
                </div>

                {isPublishedOpen ? (
                    <>
                        {isPublishedLoading && publishedItems.length === 0 ? (
                            <p className={styles.mutedText}>Загрузка опубликованных...</p>
                        ) : publishedItems.length === 0 ? (
                            <p className={styles.mutedText}>
                                Опубликованных отзывов пока нет.
                            </p>
                        ) : (
                            <>

                                <AdminReviewsTable
                                    adminNoteDrafts={adminNoteDrafts}
                                    items={publishedItems}
                                    previewLimit={previewLimit}
                                    updatingId={updatingId}
                                    showOrderControls
                                    isOrderUpdating={isReviewOrderUpdating}
                                    onAdminNoteChange={handleAdminNoteChange}
                                    onOrderAction={handlePublishedOrderAction}
                                    onUpdateReview={handleUpdateReview}
                                />
                            </>
                        )}

                        {publishedHasMore ? (
                            <div className={styles.loadMoreRow}>
                                <AdminButton
                                    type="button"
                                    variant="secondary"
                                    className={styles.loadMoreButton}
                                    onClick={() => void loadPublishedReviews("append")}
                                    disabled={isPublishedLoading || isReviewOrderUpdating}
                                >
                                    {isPublishedLoading
                                        ? "Загрузка..."
                                        : `Показать ещё ${REVIEW_PAGE_SIZE}`}
                                </AdminButton>
                            </div>
                        ) : null}
                    </>
                ) : null}
            </AdminSection>

            <AdminSection>
                <div className={styles.reviewsGroupHeader}>
                    <div>
                        <h2 className={styles.reviewsGroupTitle}>Скрытые отзывы</h2>
                        <p className={styles.reviewsGroupDescription}>
                            Отзывы, которые сохранены в CRM, но не показываются публично.
                        </p>
                    </div>

                    <AdminButton
                        type="button"
                        variant="secondary"
                        onClick={handleToggleHidden}
                        disabled={isHiddenLoading || isReviewOrderUpdating}
                    >
                        {isHiddenOpen ? "Скрыть скрытые" : "Показать скрытые"}
                    </AdminButton>
                </div>

                {isHiddenOpen ? (
                    <>
                        {isHiddenLoading && hiddenItems.length === 0 ? (
                            <p className={styles.mutedText}>Загрузка скрытых...</p>
                        ) : hiddenItems.length === 0 ? (
                            <p className={styles.mutedText}>Скрытых отзывов пока нет.</p>
                        ) : (
                            <AdminReviewsTable
                                adminNoteDrafts={adminNoteDrafts}
                                items={hiddenItems}
                                previewLimit={previewLimit}
                                updatingId={updatingId}
                                onAdminNoteChange={handleAdminNoteChange}
                                onUpdateReview={handleUpdateReview}
                            />
                        )}

                        {hiddenHasMore ? (
                            <div className={styles.loadMoreRow}>
                                <AdminButton
                                    type="button"
                                    variant="secondary"
                                    className={styles.loadMoreButton}
                                    onClick={() => void loadHiddenReviews("append")}
                                    disabled={isHiddenLoading || isReviewOrderUpdating}
                                >
                                    {isHiddenLoading
                                        ? "Загрузка..."
                                        : `Показать ещё ${REVIEW_PAGE_SIZE}`}
                                </AdminButton>
                            </div>
                        ) : null}
                    </>
                ) : null}
            </AdminSection>
            {isResetConfirmOpen ? (
                <div
                    className={styles.confirmOverlay}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="reset-review-order-title"
                    onClick={handleCancelResetPublishedOrder}
                >
                    <div
                        className={styles.confirmDialog}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className={styles.confirmHeader}>
                            <span className={styles.confirmKicker}>Опасное действие</span>
                            <h2 id="reset-review-order-title" className={styles.confirmTitle}>
                                Сбросить порядок отзывов?
                            </h2>
                        </div>

                        <p className={styles.confirmText}>
                            Все закреплённые отзывы вернутся в обычный порядок. Если вы
                            уже расставляли отзывы вручную, восстанавливать этот порядок
                            потом придётся заново.
                        </p>

                        <div className={styles.confirmActions}>
                            <AdminButton
                                type="button"
                                variant="secondary"
                                onClick={handleCancelResetPublishedOrder}
                                disabled={isReviewOrderUpdating}
                            >
                                Отмена
                            </AdminButton>

                            <AdminButton
                                type="button"
                                variant="danger"
                                onClick={() => void handleConfirmResetPublishedOrder()}
                                disabled={isReviewOrderUpdating}
                            >
                                {isReviewOrderUpdating ? "Сбрасываем..." : "Да, сбросить"}
                            </AdminButton>
                        </div>
                    </div>
                </div>
            ) : null}
        </main>
    );
}