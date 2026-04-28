'use strict'

/**
 * Sequelize CLI 会加载本文件。`production` 在运行 `db:migrate --env production` 时
 * 从 `server/.env.production` 读取 DB_*，避免把密码写进 config.json。
 */
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

const base = require('./config.json')

function shouldLoadProductionCredentials() {
  const args = process.argv
  const idx = args.indexOf('--env')
  if (idx !== -1 && args[idx + 1] === 'production') return true
  return args.some(a => /^--env=production$/.test(a))
}

function loadProductionFromEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.production')
  if (!fs.existsSync(envPath)) {
    throw new Error(
      `缺少 ${path.relative(process.cwd(), envPath)}。请在其中配置 DB_HOST、DB_NAME、DB_USER、DB_PASSWORD、DB_SSL。`
    )
  }

  const parsed = dotenv.parse(fs.readFileSync(envPath))
  const host = parsed.DB_HOST || parsed.DATABASE_URL
  if (!host) {
    throw new Error('.env.production 必须包含 DB_HOST（或 DATABASE_URL 为 RDS 主机名）。')
  }
  if (!parsed.DB_USER || !parsed.DB_NAME) {
    throw new Error('.env.production 必须包含 DB_USER 与 DB_NAME。')
  }

  const ssl = String(parsed.DB_SSL || '').toLowerCase() === 'true'

  return {
    username: parsed.DB_USER,
    password: parsed.DB_PASSWORD ?? null,
    database: parsed.DB_NAME,
    host,
    dialect: 'postgres',
    dialectOptions: ssl
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : {},
  }
}

module.exports = {
  development: base.development,
  test: base.test,
  production: shouldLoadProductionCredentials()
    ? loadProductionFromEnvFile()
    : base.production,
}
