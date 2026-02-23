FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Set default DATABASE_URL for build
ENV DATABASE_URL="file:./dev.db"

RUN npx prisma generate
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]