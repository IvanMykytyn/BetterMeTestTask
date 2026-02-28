# BetterMeTestTask

The **BetterMeTestTask** project is a web service for automated calculation of sales tax in the state of New York based on the buyer’s coordinates. It uses geospatial data of counties and cities, allowing accurate determination of the tax jurisdiction and application of the corresponding tax rates. The system supports both bulk processing of CSV transaction files and manual input, ensuring calculation accuracy and transparency for accounting and auditing. 

The project was developed by the **ColDev** team under the web direction for the All-Ukrainian hackathon **INT20H – 2026**.  

You can access the project here: [BetterMeTestTask](https://bettermetesttask-3.onrender.com)

---

## Scenario Overview

**Instant Wellness Kits** is a successful service for urgent delivery of compact wellness kits. The main unique advantage of the business is the ultra-fast delivery of products to the buyer using drones. Delivery is completed within 20–30 minutes across the state of New York.

The mobile application works as follows:

1. The user selects the product and places an order.
2. GPS obtains the delivery coordinates.
3. The drone delivers the package.

**Problem:** The user sales tax was not accounted for at checkout.  
**Impact:** A large number (11k+) of already paid orders by customers were missing tax calculations.

---

## Business Problem Details

According to New York state law, **sales tax** is paid by the buyer when purchasing certain categories of goods and services, and the seller is obligated to calculate, collect, and remit this tax to the government.

In the U.S., there is no single user tax rate; each state sets its own rate at multiple levels:

- **State sales tax** – applied at the state level.
- **Local sales tax** – applied at the county/city level.

In New York, an additional tax applies to certain cities and counties, which must be paid to the **Metropolitan Commuter Transportation District (MCTD)**.

The team collected information from official government sources, specifically the **New York State Department of Taxation and Finance**, to determine the applicable tax rates for the state, counties, specific cities, and the MCTD.  

Official document reference: [Sales Tax Publication 718c](https://www.tax.ny.gov/pdf/publications/sales/pub718c.pdf)  

This document provides combined state and local tax rates along with reporting codes used in sales tax filings.  

The problem is particularly critical for **high transaction volumes**, as even minor errors in rates can result in significant financial losses.  

**Solution:** Automated calculation based on precise tax jurisdiction determination reduces human error and minimizes the risk of systemic mistakes.

---

## Technical Solutions and Project Conditions

The system must accept:

- Latitude
- Longitude
- Purchase amount (subtotal)

Based on this data, the system must:

- Determine the tax jurisdiction
- Calculate the tax rate
- Compute the tax amount

**Solution Logic:**

1. Determine tax jurisdiction using geospatial data (state, county, city).
2. Calculate the tax rate for each jurisdiction.

Geospatial data in **shapefile format** was obtained from official U.S. government sources, specifically agencies providing territorial boundaries (TIGER/Line).

### Additional Considerations:

- If a city cannot be determined for an order, the coordinates lie outside defined city boundaries. In such cases, base rates apply: **New York state tax + relevant county tax**, special city surcharges are not applied.
- **Why shapefiles:**  
  - Official source: boundaries of counties and municipalities in formalized format.  
  - Geometric precision: polygons allow accurate coordinate assignment.  
  - Spatial operations: point-in-polygon checks ensure correct jurisdiction.  
  - Polygon boundaries account for discrepancies with ZIP codes or administrative expectations.

### Assumptions:

- All coordinates belong to **New York state**; other states are outside the current project scope.
- Tax rates as of **March 1, 2025**, are assumed constant during the test period (CSV transactions dated 04.11.2025 – 22.02.2026). In practice, effective dates and historical rates should be supported.

---

## CSV Processing Flow

1. User (admin/operator) uploads a CSV file via the web interface.
2. Preliminary validation checks:
   - File can be read via `pandas.read_csv`.
   - Required columns: `timestamp`, `latitude`, `longitude`, `subtotal`.
   - No empty values in critical columns.
   - Timestamp format conforms to ISO 8601.
   - Numeric columns contain only numbers.
3. If validation fails, a list of errors is returned; otherwise, processing continues.
4. CSV data is read into a DataFrame, timestamps are converted to `datetime`.
5. Tax rates for state, counties, cities, and special districts are loaded into dictionaries to optimize performance for **10,000+ records**.
6. **Jurisdiction determination:** For each row:
   - Create `Point(lon, lat)`.
   - Use `STRtree` to find candidate polygons for counties and cities. To determine which polygon contains a given point, a spatial index (STRtree) is used instead of checking all polygons. This significantly speeds up processing, reducing the search complexity from O(n) to approximately O(log n).
   - Point-in-polygon check assigns each transaction its jurisdiction.
7. `create_order_object` generates an `OrderTaxRecord` instance with the appropriate rates (`state_rate`, `county_rate`, `city_rate`, `special_rates`).
8. Calculation of `composite_tax_rate`, `tax_amount`, and `total_amount` is performed directly in model methods.
9. All objects are collected and inserted via `bulk_create()` for efficiency.

**Summary Flow:**  
`Upload → Validation → Parsing → Geo-determination → Object creation → bulk_create → View`

---

## Manual Input Flow

1. User enters `timestamp`, `latitude`, `longitude`, `subtotal` via a form.
2. Timestamp is converted to `datetime`.
3. Tax rates for state, county, city, and special districts are loaded.
4. Jurisdiction is determined using the same `find_county` and `find_city` functions.
5. An `OrderTaxRecord` object is created and saved to the database.

**Summary Flow:**  
`Form → Conversion → Geo-determination → Object creation → save() → Display`

---

## Viewing Processed Results

- All records are stored in the `OrderTaxRecord` table.
- Opening the view page queries the database and returns the queryset.
- Data is displayed in a table for review and audit purposes.

**Summary:**  
`Queryset → Table list → Details → Audit`

---

## Architectural Advantages

1. Single `create_order_object` function for both CSV and manual input, avoiding logic duplication, ensuring consistent calculation, and simplifying maintenance and scaling.
2. Tax and total calculations performed in model methods, ensuring accuracy regardless of input method.
3. Composite tax rate stored with precision up to **5 decimal places** (e.g., 0.08725), critical for accounting and tax reporting, avoiding rounding errors in large-scale calculations.

---



Локальний запуск (SQLite)

Ці інструкції дозволяють запустити проєкт BetterMeTestTask на вашій машині з використанням SQLite.

1. Клонування репозиторію

Відкрийте термінал і виконайте:

git clone https://github.com/IvanMykytyn/BetterMeTestTask.git

cd BetterMeTestTask

2. Створення віртуального оточення

Створіть та активуйте віртуальне оточення для Python 3.12.2

Для Windows:
python3.12 -m venv venv
venv\Scripts\activate

Для Mac/Linux:
python3.12 -m venv venv
source venv/bin/activate

3. Встановлення залежностей

Оновіть pip і встановіть всі пакети:

pip install --upgrade pip
pip install -r requirements.txt

4. Налаштування середовища

Створіть файл .env у корені проєкту зі вмістом:

SECRET_KEY=django-insecure-r%%x2uf%v!a92tl8*)f6@rz_kiuxzhofv+5m$c7fxvhfgbdg
DEBUG=True
ALLOWED_HOSTS=*
ADMIN_USERNAME=clodev
ADMIN_PASSWORD=clodev
CORS_ALLOWED_ORIGINS=CORS_ALLOWED_ORIGINS=http://localhost:5173

Для локальної роботи DEBUG включено, DATABASE_URL не потрібен.

5. Налаштування бази даних

У backend/settings.py переконайтесь, що використовується SQLite:

DATABASES = {
'default': {
'ENGINE': 'django.db.backends.sqlite3',
'NAME': BASE_DIR / 'db.sqlite3',
}
}

6. Міграції

Створіть та застосуйте міграції:

python manage.py makemigrations
python manage.py migrate

7. Створення суперюзера

Для зручності створений скрипт міграції для автоматичного створення суперюзера з даними .env.
Якщо потрібно вручну:

python manage.py createsuperuser --username=clodev --email=clodev@example.com

Пароль використовуйте з .env (ADMIN_PASSWORD=clodev).

8. Завантаження фікстур

Щоб заповнити таблиці податкових ставок, виконайте:

python manage.py loaddata counter/fixtures/state_tax_rates.json
python manage.py loaddata counter/fixtures/city_tax_rates.json
python manage.py loaddata counter/fixtures/county_tax_rates.json
python manage.py loaddata counter/fixtures/special_tax_rates.json

9. Перевірка файлів геоданих

Переконайтеся, що на місці:

backend/data/ny_counties.geojson
backend/data/ny_places.geojson

10. Запуск сервера

Запустіть Django сервер:

python manage.py runserver

Відкрийте браузер за адресою: http://127.0.0.1:8000

Адмінка: http://127.0.0.1:8000/admin/

Логін/пароль із .env.

**Завдяки цим налаштуванням Ви зможете:**

- запустити сервер;
- створити базу даних і наповнити її актуальними ставками податків;
- створити суперюзера та увійти в адмін-панель Django для перегляду ставок податків і, за потреби, їх редагування;
- редагувати результуючу таблицю обчислених замовлень.

**Використання API через Postman**
Після того як сервер запущено та база даних заповнена, можна тестувати функціонал через Postman.

1. Перевірка роботи фронтенду
Браузерний фронт підключається до API за адресою:
http://127.0.0.1:8000/api/

Щоб перевірити роботу API без фронту, у Postman зробіть GET-запит на ендпоінт:
GET http://127.0.0.1:8000/api/orders/

Якщо сервер відповідає, API працює.

Усі запити до API потребують авторизації, якщо захищено.

2. Завантаження CSV файлу через Postman

Метод: POST

URL: http://127.0.0.1:8000/counter/import

Тип запиту: form-data

Ключ: file, тип – File

Значення: оберіть CSV-файл з транзакціями (з колонками timestamp, latitude, longitude, subtotal)

Postman приклад:

Вкладка Body → form-data

key = file, type = File, choose file → ваш CSV

Після відправки сервер поверне JSON з результатом обробки: список успішних записів або помилок валідації.

3. Ручне додавання координат через Postman

Метод: POST

URL: http://127.0.0.1:8000/counter/orders
Тип запиту: raw → JSON

Приклад тіла запиту:
{
"timestamp": "2026-02-27T12:00:00Z",
"latitude": 40.7128,
"longitude": -74.0060,
"subtotal": 100.0
}

Сервер обробляє дані, обчислює податки і зберігає запис у таблиці OrderTaxRecord.

4. Перегляд результатів


Усі оброблені записи (через CSV або ручний ввід) можна переглянути лише в адмінці Django:
http://127.0.0.1:8000/counter/orders

Вхід: логін/пароль із .env (ADMIN_USERNAME / ADMIN_PASSWORD)

В адмінці відкрийте модель OrderTaxRecord

Там відображаються всі транзакції: координати, сума покупки, податки та загальна сума.

Примітка: без завантаження CSV або ручного введення таблиця буде порожня.






Проєкт **BetterMeTestTask** представляє собою веб-сервіс для автоматизованого розрахунку податку з продажу в штаті Нью-Йорк на основі координат покупця. Він використовує геопросторові дані округів і міст, дозволяючи точно визначати податкову юрисдикцію та застосовувати відповідні ставки податку. Система підтримує як масову обробку CSV-файлів з транзакціями, так і ручний ввід, забезпечуючи точність розрахунків та прозорість для бухгалтерії і аудиту. Проєкт розроблений командою ColDev за напрямком web для всеукраїнського хакатону INT20H – 2026.

Запрошуємо Вас за посиланням: [BetterMeTestTask](https://bettermetesttask-3.onrender.com)

#### Короткий опис сценарію

	Instant Wellness Kits - успішний сервіс термінової доставки компактних наборів. Найбільша унікальність і перевага бізнесу полягає надшвидкий доставці товару до покупця за допомогою квадрокоптера. Доставка здійснюється протягом 20-30 хвилин по всьому штату Нью-Йорк.
	
Мобільний застосунок Instant Wellness Kits працює таким чином:
користувач обирає необхідний товар, оформлює замовлення
GPS отримує координати доставки замовлення
дрон доставляє пакунок
	
**Недолік** - під час сплати замовлення не враховувався користувацький податок.
**Проблема** - велика кількість (11k+) вже сплачених замовлень покупцями (без урахування податків).


#### Деталізація бізнес-проблеми

Відповідно до законодавства штату New York, податок з продажу (sales tax) сплачується покупцем при придбанні визначених категорій товарів і послуг, а продавець зобов’язаний нарахувати, утримати та перерахувати цей податок до бюджету. 
У США не існує єдиної ставки на користувацький податок, а це означає, що кожен штат самостійно встановлює свою ставку на декількох рівнях:
Податок з продажу штату - на рівні штату
Місцевий податок з продажу -  на рівні округу/міста.
На території штату New York діє додатковий податок на певні міста і округи, що має сплачуватись у спеціальний транспортні округ - Metropolitan Commuter Transportation District. 
Командою було проведено збір інформації з офіційних державних  ресурсів, а саме з сайту податкової служби штату Нью Йорк “Department of Taxation and Finance”,  і встановлено відповідні існуючі ставки податків для штату, округів, певних міст та спеціального транспортного округу.
	Посилання на офіційний документ: https://www.tax.ny.gov/pdf/publications/sales/pub718c.pdf
	Наведений вище документ містить ставку державного податку в поєднанні з будь-яким чинним податком з продажу округу та міста, а також коди звітності, що використовуються у деклараціях з податку з продажу.
Проблема є особливо актуальною за великого обсягу транзакцій, коли навіть незначна помилка в ставці масштабується у суттєві фінансові втрати.

**Вирішення проблеми:**
Автоматизований розрахунок на основі точного визначення податкової юрисдикції, що зменшує вплив людського фактора та мінімізує ймовірність системної помилки.



#### Опис технічних рішень та умов реалізації проєкту

Організаторами було визначено, що система повинна приймати: 
- широту (latitude),
- довготу (longitude),
- суму покупки (subtotal).
- На основі цих даних система повинна: визначити податкову юрисдикцію., розрахувати ставку - податку, обчислити суму податку.


**Логіка вирішення завдання полягала у:**
а)  визначення податкової юрисдикції за геопросторові даними (штат, округ, місто);
б) для кожної юрисдикції - визначити суму податкової ставки.

Для визначення податкової юрисдикції ми використовували геопросторові дані у форматі shapefile, що були взяті з офіційних сайтів органів влади США, зокрема служби, що працюють із територіальними межами (TIGER/Line). Для пошуку полігону, що містить задану точку, використовується просторовий індекс STRtree замість перевірки всіх полігонів. Це значно прискорює обробку, знижуючи складність пошуку з O(n) до приблизно O(log n).

**Додатково було враховано:**
Якщо для замовлення не вдається визначити місто, це означає, що координати точки лежать за межами визначених меж міст у шейпфайлі. У такому випадку застосовуються базові ставки: ставка штату Нью-Йорк плюс ставка відповідного округу, а спеціальні міські надбавки не враховуються.

**Чому саме shapefile:**
Офіційність джерела -  межі округів та муніципалітетів надані у формалізованому вигляді. Геометрична точність - полігони дозволяють визначити точне входження координати у межі конкретної території. Можливість просторових операцій - перевірка point-in-polygon для встановлення юрисдикції. А оскільки податкові межі не завжди збігаються з поштовими індексами або адміністративними очікуваннями, саме полігональні межі забезпечують коректне визначення округу або міста.

**Нами були зроблені наступні припущення:**
1. Для спрощення реалізації було прийнято, що усі координати належать лише одному штату - New York, та обробка інших штатів не входить у поточний обсяг задачі. Дане припущення було зроблене з метою зменшення складності архітектури і утриманні фокусу на бізнес-логіці розрахунку, що дозволило уникнути перевірки належності точки до штату і значного розширення бази ставок для більш точного опрацювання даних.
2. Додатко нашою командою було зроблено припущення щодо періоду ставок, а саме: ставки, чинні на 1 березня 2025 року, залишалися незмінними протягом тестового періоду. (Тестовий CSV-файл містив покупки за період з 04.11.2025 року по  22.02.2026 року. Офіційна довідка зі ставками була надана станом на 01.03.2025 року.)
Але ми розуміємо, що у реальному бізнес-середовищі доцільно реалізувати зберігання дати набуття чинності ставки і підтримку історичних періодів.


#### **Опис флоу обробки CSV-файлу**
Користувач (адміністратор або оператор) завантажує CSV-файл через веб-інтерфейс. 
Перед масовою обробкою файл проходить швидку перевірку структури: чи можливо читати файл через pandas.read_csv, наявність обов’язкових колонок: timestamp, latitude, longitude, subtotal.
Перевіряється на порожні значення: чи немає NaN у критичних колонках.
Перевіряється формату дати: колонка timestamp повинна відповідати формату ISO 8601.  Використовується “pd.to_datetime(..., errors="raise", utc=True)”.
Перевіряються числові типи, а саме колонки latitude, longitude, subtotal повинні містити лише числа.
Якщо знайдено помилки - повертається список повідомлень. Якщо помилок немає - повертається порожній список. Це дозволяє уникнути часткової обробки файлу та запобігти неконсистентним даним у БД.
Після успішної валідації запускається основний процес - зчитування CSV. Файл зчитується у DataFrame. Колонка timestamp конвертується у datetime. Щоб уникнути запитів до БД для кожного рядка - ставка штату отримується один раз з БД, ставки округів, міст і спеціальні ставки формуються у словники, що є критичним для продуктивності при 10 000+ записах.
Визначення юрисдикції (геопросторовий етап) здійснюється наступним чином: для кожного рядка створюється точка Point(lon, lat), для якої через STRtree виконується швидкий пошук кандидатів для округів, міст та спец. округів. Таким чином перевіряється входження точки у полігон і визначаються  її юрисдикції в межах штату New York. 
Після цього створюється об’єкт транзакції за допомогою функції create_order_object, яка визначає округ та місто і підставляє відповідні ставки, формуючи об’єкт OrderTaxRecord (без збереження).
Ставки складаються з state_rate, county_rate, city_rate та special_rates.
Обчислення сумарної ставки податків для конкретної покупки (composite_tax_rate), суми податку до сплати (tax_amount) та загальна сума покупки з податком (total_amount) виконується безпосередньо в методах моделі OrderTaxRecord, що дозволяє забезпечити точність і узгодженість даних.
Усі об’єкти накопичуються у список orders_to_create. Після цього виконується bulk_create(), що  дає змогу мінімізувати кількість SQL-запитів і значне прискорення обробки великих файлів.

**Узагальнено:** 
Завантаження → Валідація → Парсинг → Гео-визначення → Формування об’єктів → bulk_create → Перегляд


#### **Опис флоу ручного введення даних**
Ручний сценарій використовує ту саму бізнес-логіку, але обробляє один запис.
Після того, як користувач вводить дані у форму, що приймає timestamp, latitude, longitude та subtotal, які валідує frontend. Далі дата конвертується і timestamp і перетворюється у datetime. 
Так само, як і в CSV, завантажуються ставки податків для штату, округу, міста (якщо для даного міста така існує) і спеціальна ставки (теж якщо для даного міста така існує).
Для визначення юрисдикції використовуються ті самі функції: find_county, find_city.
Після визначення основних даних створюється один об’єкт і виконується запис у БД.

**Узагальнено:** 
Форма → Конвертація → Гео-визначення → Створення об’єкта → save() → Відображення


#### **Опис можливостей перегляду оброблених результатів**
Після збереження всі записи знаходяться в таблиці OrderTaxRecord.  Список транзакцій показується одразу при відкритті сторінки перегляду. 
Таким чином при відкритті сторінки перегляду: виконується запит до БД і повертається queryset записів. Дані відображаються у таблиці.

**Узагальнено:**
Queryset → Табличний список → Деталізація → Аудит


#### **Архітектурними  перевагами нашого підходу вирішення задачі є:**

1. Використання єдиної функції create_order_object, яка використовується і для CSV, і для ручного введення, що забезпечує відсутність дублювання логіки, однакові правила розрахунку, мінімізацію ризику розбіжностей і простоту підтримки та масштабування.
Таким чином, незалежно від способу надходження даних (масовий імпорт чи ручне введення), система використовує однаковий механізм визначення юрисдикції та розрахунку податку.
2. Розрахунок податку і загальної суми у моделях, що дозволяє забезпечити точність і узгодженість даних незалежно від того, як були введені вихідні дані — через CSV чи вручну.
3. Використання точності (до 5 знаків після коми) при зображенні сумарна ставка податків для конкретної покупки - composite_tax_rate,  що важливо для бухгалтерського обліку та податкових звітів. Збереження такої точності дозволяє уникнути накопичення помилок при масових обчисленнях та округленнях.
