FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --include=dev

COPY . .

# Generate Prisma client and compile typescript
RUN npm run build

CMD ["npm", "start"]
