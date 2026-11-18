# escolaDB

Sistema de gestão escolar em Next.js 16, React 19, TypeScript, PostgreSQL e Docker.

## Verificação local

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

## Documentação

- [Documentação operacional](./DOCUMENTACAO_OPERACIONAL.md)
- [Plano de evolução](./PLANO_DE_EVOLUCAO_ESCOLADB.md)
- [Registro de prioridades](./REGISTRO_DE_PRIORIDADES.md)

As migrações incrementais ficam em `sql/`. Nunca aplique uma migração em produção antes de restaurar o backup em um banco isolado e validar a execução repetida.
