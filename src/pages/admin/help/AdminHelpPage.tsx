export function AdminHelpPage() {
  return (
    <main style={{ display: "grid", gap: "24px" }}>
      <div>
        <h1 style={{ margin: "0 0 12px" }}>Инструкция по админке</h1>
        <p style={{ margin: 0, color: "#666", maxWidth: "900px" }}>
          Здесь собрана краткая памятка по работе с заявками, клиентами,
          сессиями, заметками и расписанием. Это внутренний help-раздел для
          специалиста.
        </p>
      </div>

      <section
        style={{
          padding: "20px",
          border: "1px solid #e5e5e5",
          borderRadius: "16px",
          background: "#fff",
        }}
      >
        <h2 style={{ marginTop: 0 }}>С чего начать</h2>
        <ol style={{ margin: 0, paddingLeft: "20px", display: "grid", gap: "8px" }}>
          <li>Проверить новые заявки в разделе «Заявки».</li>
          <li>При необходимости создать или открыть клиента.</li>
          <li>Назначить сессию в разделе «Сессии».</li>
          <li>Добавлять заметки после общения или после проведённой сессии.</li>
          <li>Следить за расписанием и исключениями в разделе «Расписание».</li>
        </ol>
      </section>

      <section
        style={{
          padding: "20px",
          border: "1px solid #e5e5e5",
          borderRadius: "16px",
          background: "#fff",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Заявки</h2>
        <ul style={{ margin: 0, paddingLeft: "20px", display: "grid", gap: "8px" }}>
          <li>
            Здесь появляются обращения с сайта. У заявки можно менять статус.
          </li>
          <li>
            Если человек новый, из заявки можно создать клиента или привязать
            заявку к уже существующему клиенту.
          </li>
          <li>
            После обработки заявки удобно переходить к клиенту, сессиям и
            заметкам через быстрые ссылки.
          </li>
        </ul>
      </section>

      <section
        style={{
          padding: "20px",
          border: "1px solid #e5e5e5",
          borderRadius: "16px",
          background: "#fff",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Клиенты</h2>
        <ul style={{ margin: 0, paddingLeft: "20px", display: "grid", gap: "8px" }}>
          <li>В разделе «Клиенты» хранится основная карточка человека.</li>
          <li>
            Здесь видно имя, контакты, источник, статус и первую связанную
            заявку.
          </li>
          <li>
            Из клиента можно быстро перейти к связанным сессиям и заметкам.
          </li>
        </ul>
      </section>

      <section
        style={{
          padding: "20px",
          border: "1px solid #e5e5e5",
          borderRadius: "16px",
          background: "#fff",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Сессии</h2>
        <ul style={{ margin: 0, paddingLeft: "20px", display: "grid", gap: "8px" }}>
          <li>
            Сессия связывает клиента, услугу, дату, время, статус и заметки.
          </li>
          <li>
            Здесь можно вручную создавать, редактировать и удалять записи.
          </li>
          <li>
            Через быстрые переходы можно открыть сессию из клиента или из
            заметки.
          </li>
        </ul>
      </section>

      <section
        style={{
          padding: "20px",
          border: "1px solid #e5e5e5",
          borderRadius: "16px",
          background: "#fff",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Заметки</h2>
        <ul style={{ margin: 0, paddingLeft: "20px", display: "grid", gap: "8px" }}>
          <li>
            В заметках можно хранить рабочие записи по клиенту или конкретной
            сессии.
          </li>
          <li>
            Если сначала выбрать клиента, список доступных сессий в фильтрах
            сузится до этого клиента.
          </li>
          <li>
            Заметку можно привязать к сессии или оставить только на уровне
            клиента.
          </li>
        </ul>
      </section>

      <section
        style={{
          padding: "20px",
          border: "1px solid #e5e5e5",
          borderRadius: "16px",
          background: "#fff",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Расписание</h2>
        <ul style={{ margin: 0, paddingLeft: "20px", display: "grid", gap: "8px" }}>
          <li>
            Здесь настраиваются правила записи: рабочие дни, часы, буферы,
            глубина записи.
          </li>
          <li>
            Исключения по датам позволяют менять обычный график на конкретный
            день.
          </li>
          <li>
            Блокировка слотов нужна, чтобы закрывать отдельные промежутки
            времени.
          </li>
        </ul>
      </section>

      <section
        style={{
          padding: "20px",
          border: "1px solid #e5e5e5",
          borderRadius: "16px",
          background: "#fff",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Связи между разделами и быстрые переходы</h2>
        <p style={{ marginTop: 0, color: "#666" }}>
          В админке есть быстрые переходы между связанными сущностями. Это
          помогает не искать всё вручную.
        </p>

        <ul style={{ margin: 0, paddingLeft: "20px", display: "grid", gap: "10px" }}>
          <li>
            <strong>Из заявок → в клиента.</strong> Если у заявки уже есть
            связанный клиент, можно быстро открыть его карточку.
          </li>
          <li>
            <strong>Из клиента → в сессии.</strong> Откроется список сессий этого
            клиента.
          </li>
          <li>
            <strong>Из клиента → к заметкам.</strong> Откроются заметки,
            связанные с этим клиентом.
          </li>
          <li>
            <strong>Из сессий → к заметкам.</strong> Можно быстро открыть
            заметки, связанные с конкретной сессией.
          </li>
          <li>
            <strong>Из заметок → в клиента или сессию.</strong> Это помогает
            быстро вернуться к связанной карточке или записи.
          </li>
        </ul>

        <div style={{ marginTop: "16px", display: "grid", gap: "8px" }}>
          <p style={{ margin: 0 }}>
            <strong>Что значит быстрый переход:</strong>
          </p>
          <ul
            style={{ margin: 0, paddingLeft: "20px", display: "grid", gap: "8px" }}
          >
            <li>страница открывается уже с нужным фильтром или привязкой;</li>
            <li>
              иногда конкретная запись будет выделена или заранее отфильтрована;
            </li>
            <li>
              для возврата в обычный режим используй кнопку вида «Показать все
              ...».
            </li>
          </ul>
        </div>
      </section>

      <section
        style={{
          padding: "20px",
          border: "1px solid #e5e5e5",
          borderRadius: "16px",
          background: "#fff",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Если что-то не загружается</h2>
        <ul style={{ margin: 0, paddingLeft: "20px", display: "grid", gap: "8px" }}>
          <li>Если появляется ошибка загрузки, сначала обнови страницу.</li>
          <li>
            Проверь, что локальный dev-сервер запущен через{" "}
            <code>npx vercel dev</code>.
          </li>
          <li>
            Если в консоли есть ошибка про <code>DATABASE_URL</code>, значит не
            подтянулась переменная окружения для базы данных.
          </li>
          <li>
            Если админка снова просит пароль, значит истекла сессия или был
            выполнен выход.
          </li>
        </ul>
      </section>

      <section
        style={{
          padding: "20px",
          border: "1px solid #e5e5e5",
          borderRadius: "16px",
          background: "#fff",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Связь с разработчиком</h2>
        <p style={{ marginTop: 0, color: "#666" }}>
          Если возникают вопросы по работе админки, нужна доработка, что-то не
          работает или потерялись прежние контакты — можно связаться с
          разработчиком:
        </p>

        <div style={{ display: "grid", gap: "8px" }}>
          <p style={{ margin: 0 }}>
            <strong>Телефон:</strong> +7-918-992-64-39
          </p>
          <p style={{ margin: 0 }}>
            <strong>Telegram:</strong> @Dudarin23
          </p>
        </div>
      </section>
    </main>
  );
}