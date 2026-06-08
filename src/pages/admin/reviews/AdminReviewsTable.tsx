import { useMemo, useState } from "react";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminTable } from "../../../components/admin/AdminTable";
import type {
    ClientReviewAdminRecord,
    ClientReviewStatus,
} from "../../../types/reviews";
import styles from "./AdminReviewsPage.module.css";
import {
    clientReviewStatusLabels,
    getPublicReviewName,
    getReviewPreviewText,
    getReviewRatingLabel,
} from "./AdminReviewsTable.helpers";
import { ReviewDetailsModal } from "./ReviewDetailsModal";

export type ReviewOrderAction = "pin" | "unpin" | "move-up" | "move-down";

type AdminReviewsTableProps = {
    adminNoteDrafts: Record<number, string>;
    items: ClientReviewAdminRecord[];
    previewLimit: number;
    updatingId: number | null;
    showOrderControls?: boolean;
    isOrderUpdating?: boolean;
    onAdminNoteChange: (id: number, value: string) => void;
    onOrderAction?: (
        item: ClientReviewAdminRecord,
        action: ReviewOrderAction
    ) => void | Promise<void>;
    onUpdateReview: (
        item: ClientReviewAdminRecord,
        status: ClientReviewStatus
    ) => void | Promise<void>;
};

function formatDateTime(value: string | null): string {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function getStatusBadgeClassName(status: ClientReviewStatus): string {
    return [
        styles.statusBadge,
        status === "pending" ? styles.statusBadgePending : "",
        status === "published" ? styles.statusBadgePublished : "",
        status === "hidden" ? styles.statusBadgeHidden : "",
        status === "deleted" ? styles.statusBadgeDeleted : "",
    ]
        .filter(Boolean)
        .join(" ");
}

function getRatingBadgeClassName(rating: number | null): string {
    return [styles.ratingBadge, rating === null ? styles.ratingBadgeEmpty : ""]
        .filter(Boolean)
        .join(" ");
}

function getRowClassName(status: ClientReviewStatus): string | undefined {
    const classNames = [
        status === "pending" ? styles.pendingRow : "",
        status === "hidden" ? styles.hiddenRow : "",
        status === "deleted" ? styles.deletedRow : "",
    ].filter(Boolean);

    return classNames.length > 0 ? classNames.join(" ") : undefined;
}

function getManualOrderIds(items: ClientReviewAdminRecord[]): number[] {
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

function getOrderButtonClassName(
    variant: "neutral" | "primary" | "danger" = "neutral"
): string {
    return [
        styles.orderButton,
        variant === "primary" ? styles.orderButtonPrimary : "",
        variant === "danger" ? styles.orderButtonDanger : "",
    ]
        .filter(Boolean)
        .join(" ");
}

export function AdminReviewsTable({
    adminNoteDrafts,
    items,
    previewLimit,
    updatingId,
    showOrderControls = false,
    isOrderUpdating = false,
    onAdminNoteChange,
    onOrderAction,
    onUpdateReview,
}: AdminReviewsTableProps) {
    const [selectedReview, setSelectedReview] =
        useState<ClientReviewAdminRecord | null>(null);

    const manualOrderIds = useMemo(() => getManualOrderIds(items), [items]);

    return (
        <>
            <AdminTable withTopMargin={false} tableClassName={styles.reviewsTable}>
                <thead>
                    <tr>
                        <th className={styles.reviewCell}>Отзыв</th>
                        <th className={styles.ratingCell}>Оценка</th>
                        <th className={styles.clientCell}>Клиент</th>
                        <th className={styles.statusCell}>Статус</th>
                        <th className={styles.dateCell}>Даты</th>
                        <th className={styles.noteCell}>Заметка админа</th>
                        <th className={styles.actionCell}>Действия</th>
                    </tr>
                </thead>

                <tbody>
                    {items.map((item) => {
                        const isUpdating = updatingId === item.id;
                        const manualOrderIndex = manualOrderIds.indexOf(item.id);
                        const hasManualOrder = manualOrderIndex !== -1;
                        const canMoveUp = manualOrderIndex > 0;
                        const canMoveDown =
                            manualOrderIndex >= 0 &&
                            manualOrderIndex < manualOrderIds.length - 1;
                        const shouldShowOrderControls =
                            showOrderControls &&
                            item.status === "published" &&
                            Boolean(onOrderAction);

                        return (
                            <tr key={item.id} className={getRowClassName(item.status)}>
                                <td className={styles.reviewCell}>
                                    <button
                                        className={styles.reviewPreviewButton}
                                        type="button"
                                        onClick={() => setSelectedReview(item)}
                                    >
                                        <span className={styles.reviewAuthor}>
                                            {getPublicReviewName(item.publicName)}
                                        </span>

                                        <span className={styles.reviewText}>
                                            {getReviewPreviewText(item.text, previewLimit)}
                                        </span>
                                    </button>
                                </td>

                                <td className={styles.ratingCell}>
                                    <span className={getRatingBadgeClassName(item.rating)}>
                                        {getReviewRatingLabel(item.rating)}
                                    </span>
                                </td>

                                <td className={styles.clientCell}>
                                    <div className={styles.clientPreview}>
                                        <strong>{item.clientName}</strong>

                                        <span>{item.clientPhone || "Телефон не указан"}</span>
                                        <span>{item.clientEmail || "Email не указан"}</span>

                                        {item.eligibilitySessionId ? (
                                            <span className={styles.eligibilityText}>
                                                Проверочная сессия найдена
                                            </span>
                                        ) : (
                                            <span className={styles.eligibilityText}>
                                                Проверочная сессия не указана
                                            </span>
                                        )}
                                    </div>
                                </td>

                                <td className={styles.statusCell}>
                                    <span className={getStatusBadgeClassName(item.status)}>
                                        {clientReviewStatusLabels[item.status]}
                                    </span>
                                </td>

                                <td className={styles.dateCell}>
                                    <div className={styles.dateStack}>
                                        <span>
                                            <strong>Создан:</strong> {formatDateTime(item.createdAt)}
                                        </span>
                                        <span>
                                            <strong>Опубликован:</strong>{" "}
                                            {formatDateTime(item.publishedAt)}
                                        </span>
                                    </div>
                                </td>

                                <td className={styles.noteCell}>
                                    <textarea
                                        className={styles.noteTextarea}
                                        value={adminNoteDrafts[item.id] ?? ""}
                                        placeholder="Внутренняя заметка специалиста"
                                        disabled={isUpdating}
                                        onChange={(event) =>
                                            onAdminNoteChange(item.id, event.target.value)
                                        }
                                    />
                                </td>

                                <td className={styles.actionCell}>
                                    <div className={styles.actionsStack}>
                                        {shouldShowOrderControls ? (
                                            <div className={styles.orderControls}>
                                                <span
                                                    className={styles.orderBadge}
                                                    title={
                                                        hasManualOrder
                                                            ? "Закреплённый отзыв показывается выше обычных отзывов."
                                                            : "Обычный порядок: отзыв показывается после закреплённых."
                                                    }
                                                >
                                                    {hasManualOrder ? `№ ${item.publicOrder}` : "Обычный"}
                                                </span>

                                                {hasManualOrder ? (
                                                    <>
                                                        <button
                                                            className={getOrderButtonClassName()}
                                                            type="button"
                                                            disabled={!canMoveUp || isOrderUpdating || isUpdating}
                                                            onClick={() => void onOrderAction?.(item, "move-up")}
                                                        >
                                                            ↑ Выше
                                                        </button>

                                                        <button
                                                            className={getOrderButtonClassName()}
                                                            type="button"
                                                            disabled={!canMoveDown || isOrderUpdating || isUpdating}
                                                            onClick={() => void onOrderAction?.(item, "move-down")}
                                                        >
                                                            ↓ Ниже
                                                        </button>

                                                        <button
                                                            className={getOrderButtonClassName("danger")}
                                                            type="button"
                                                            disabled={isOrderUpdating || isUpdating}
                                                            onClick={() => void onOrderAction?.(item, "unpin")}
                                                        >
                                                            Открепить
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        className={getOrderButtonClassName("primary")}
                                                        type="button"
                                                        disabled={isOrderUpdating || isUpdating}
                                                        onClick={() => void onOrderAction?.(item, "pin")}
                                                    >
                                                        Закрепить
                                                    </button>
                                                )}
                                            </div>
                                        ) : null}

                                        <button
                                            className={styles.detailsButton}
                                            type="button"
                                            onClick={() => setSelectedReview(item)}
                                        >
                                            Подробнее
                                        </button>

                                        {item.status !== "published" ? (
                                            <AdminButton
                                                type="button"
                                                variant="primary"
                                                size="sm"
                                                disabled={isUpdating}
                                                onClick={() => void onUpdateReview(item, "published")}
                                            >
                                                Опубликовать
                                            </AdminButton>
                                        ) : null}

                                        {item.status !== "hidden" ? (
                                            <AdminButton
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                disabled={isUpdating}
                                                onClick={() => void onUpdateReview(item, "hidden")}
                                            >
                                                Скрыть
                                            </AdminButton>
                                        ) : null}

                                        {item.status === "deleted" ? (
                                            <AdminButton
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                disabled={isUpdating}
                                                onClick={() => void onUpdateReview(item, "hidden")}
                                            >
                                                Восстановить
                                            </AdminButton>
                                        ) : (
                                            <AdminButton
                                                type="button"
                                                variant="danger"
                                                size="sm"
                                                disabled={isUpdating}
                                                onClick={() => void onUpdateReview(item, "deleted")}
                                            >
                                                Удалить
                                            </AdminButton>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </AdminTable>

            {selectedReview ? (
                <ReviewDetailsModal
                    adminNote={adminNoteDrafts[selectedReview.id] ?? ""}
                    item={selectedReview}
                    onClose={() => setSelectedReview(null)}
                />
            ) : null}
        </>
    );
}