# TopTruyen Spring Boot Backend

Backend API mau cho du an TopTruyen.

## Yeu cau

- Java 17+
- Maven 3.9+

## Chay local

```bash
mvn spring-boot:run
```

Server mac dinh: `http://localhost:8080`

Co the set bien moi truong DB truoc khi chay:

- `DB_URL` (mac dinh `jdbc:mysql://localhost:3306/toptruyen_db?...`)
- `DB_USERNAME` (mac dinh `root`)
- `DB_PASSWORD` (mac dinh rong)

Bien moi truong cho ImageKit.io upload anh:

- `IMAGEKIT_URL_ENDPOINT` (vd `https://ik.imagekit.io/toptruyen`)
- `IMAGEKIT_PRIVATE_KEY`
- `IMAGEKIT_FOLDER` (mac dinh `/toptruyen/uploads/images`)
- `IMAGEKIT_MAX_FILE_SIZE_BYTES` (mac dinh `10485760` ~ 10MB)

Luu y bao mat:

- `IMAGEKIT_PRIVATE_KEY` chi duoc dat o backend (.env hoac secret manager), khong dua vao frontend.
- Frontend chi nen dung `VITE_IMAGEKIT_URL_ENDPOINT` va `VITE_IMAGEKIT_PUBLIC_KEY`.
- Khong commit file `.env` len Git. Du an da co file `.env.example` de tham khao.

## API co san

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/uploads/images` (multipart form-data voi field `file`)
- `GET /api/comics`
- `GET /api/comics/hot`
- `GET /api/categories`

## Vi du payload

### POST /api/auth/login

```json
{
  "email": "demo@toptruyen.com",
  "password": "123456"
}
```

### POST /api/auth/register

```json
{
  "name": "TopTruyen User",
  "email": "user@toptruyen.com",
  "password": "123456",
  "confirmPassword": "123456"
}
```
