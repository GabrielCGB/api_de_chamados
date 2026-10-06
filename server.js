import express from 'express';
import pool from './db.js';


const app = express();
app.use(express.json());

const registrarRequisicao = (req, res, next) => {
    const agora = new Date();
    console.log(agora.toLocaleString());
    
    next();
}

const validarChamado = (req, res, next) => {
    const {titulo, descricao, setor, prioridade} = req.body

    if (!titulo || !descricao || !setor || !prioridade) {
        return res.status(400).json({
          erro: "Todos os campos são obrigatórios"
        });
    }

    next()
}

const validarPrioridade = (req, res, next) => {
    const { prioridade } = req.body
    const prioridadesValidas = ["baixa", "media", "alta"]

    if(!prioridadesValidas.includes(prioridade)){
        return res.status(400).json({
            erro: "Prioridade inválida. Use: baixa, media ou alta"
          });
    }

    next()
}

const usuarios = [
    { id: 1, token: 'tecnico123', nome: 'Carlos', tipo: 'tecnico' },
    { id: 2, token: 'admin123', nome: 'Administrador', tipo: 'admin' }
  ];

const verificarAutenticacao = (req, res, next) => {
    const {token} = req.headers
    console.log(token);
    
    const usuario = usuarios.find((u) => u.token === token)

    if (!usuario) {
        return res.status(401).json({ erro: 'Usuário não autenticado' });
      }
    
      req.usuario = usuario
      next();
    };

    const somenteAdmin = (req, res, next) => {
        if (req.usuario.tipo !== 'admin') {
            return res.status(403).json({ erro: 'Acesso negado. Apenas administradores.' });
        }
    
        next();
    };




    app.use(registrarRequisicao);























    
    
    app.get('/chamados', async (req, res) => {
        const { status, prioridade } = req.query;
        
        const condicoes = [];
        const valores = [];
        
        if (status) {
            valores.push(status);
            condicoes.push(`status = $${valores.length}`);
        }
        
        if (prioridade) {
            valores.push(prioridade);
            condicoes.push(`prioridade = $${valores.length}`);
        }
        
        let sql = 'SELECT * FROM chamados';
        
        if (condicoes.length > 0) {
            sql += ' WHERE ' + condicoes.join(' AND ');
        }
        
        sql += ' ORDER BY id';
        
        try {
            const resultado = await pool.query(sql, valores);
            return res.status(200).json(resultado.rows);
        } catch (erro) {
            next(erro)
        }
    });
    
    
    
    
    
    
    app.get('/chamados/:id', verificarAutenticacao, async (req, res) => {
        const id = Number(req.params.id);
        
        
        try{
            const resultado = await pool.query(`SELECT * FROM chamados WHERE id = $1`, [id])
            if (resultado.rows.length === 0) {
                return res.status(404).json({
                    erro: "Chamado não encontrado"
                })
            }
            
            return res.status(201).json(resultado.rows[0])
        }
        catch(erro){
            next(erro)
        }
    });
    
    app.get('/chamados/estatisticas', async (req, res) => {
        try {
            const resultado = await pool.query(`
            SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE status = 'aberto')::int AS abertos,
            COUNT(*) FILTER (WHERE status = 'em_atendimento')::int AS em_atendimento,
            COUNT(*) FILTER (WHERE status = 'finalizado')::int AS finalizados,
            COUNT(*) FILTER (WHERE prioridade = 'alta')::int AS prioridade_alta
            FROM chamados
            `);
            
            return res.status(200).json(resultado.rows[0]);
        } catch (erro) {
            next(erro)
        }
    });
    
    app.post('/chamados', validarChamado, validarPrioridade, async (req, res) => {
        const { titulo, descricao, setor, prioridade } = req.body
        try{
            const resultado = await pool.query(`INSERT INTO chamados (titulo, descricao, setor, prioridade) VALUES ($1, $2, $3, $4) RETURNING*`, 
            [ titulo, descricao, setor, prioridade ])
            
            return res.status(201).json(resultado.rows[0])
        }
        catch(erro){
            next(erro)
        }  
    });






  app.patch('/chamados/:id/assumir', verificarAutenticacao, async (req, res) => {
    const id = Number(req.params.id);
  
    if (!Number.isInteger(id)) {
      return res.status(400).json({ erro: "ID inválido" });
    }
  
    try {
      // 2) localizar o chamado
      const busca = await pool.query('SELECT * FROM chamados WHERE id = $1', [id]);
  
      // 3) verificar se existe
      if (busca.rows.length === 0) {
        return res.status(404).json({ erro: "Chamado não encontrado" });
      }
  
      // 4) verificar se ainda está aberto
      if (busca.rows[0].status !== 'aberto') {
        return res.status(409).json({ erro: "Chamado não está aberto" });
      }
  
      // 5, 6, 7) alterar status, registrar responsável e persistir
      const resultado = await pool.query(`UPDATE chamados SET status = 'em_atendimento', responsavel = $1 WHERE id = $2 RETURNING *`,
      [req.usuario.nome, id]
      );
  
      // 8) retornar o registro atualizado
      return res.status(200).json(resultado.rows[0]);
    } catch (erro) {
      next(erro)
    }
  });





  app.patch('/chamados/:id/finalizar', verificarAutenticacao, async (req, res) => {
    const id = Number(req.params.id);
  
    if (!Number.isInteger(id)) {
      return res.status(400).json({ erro: "ID inválido" });
    }
  
    try {
      const busca = await pool.query('SELECT * FROM chamados WHERE id = $1', [id]);
  
      if (busca.rows.length === 0) {
        return res.status(404).json({ erro: "Chamado não encontrado" });
      }
  
      const status = busca.rows[0].status;
  
      if (status === 'aberto') {
        return res.status(409).json({
          erro: "Chamado aberto não pode ser finalizado diretamente. Assuma o chamado primeiro."
        });
      }
  
      if (status === 'finalizado') {
        return res.status(409).json({ erro: "Chamado já foi finalizado" });
      }
  
      const resultado = await pool.query(
        `UPDATE chamados SET status = 'finalizado' WHERE id = $1 RETURNING *`,
        [id]
      );
  
      return res.status(200).json(resultado.rows[0]);
    } catch (erro) {
      next(erro)
    }
  });





  app.delete('/chamados/:id', verificarAutenticacao, somenteAdmin, async (req, res) => {
        const id = Number(req.params.id);
    
        if (!Number.isInteger(id)) {
            return res.status(400).json({ erro: "ID inválido" });
        }
    
        try {
            const resultado = await pool.query(
                'DELETE FROM chamados WHERE id = $1 RETURNING *',
                [id]
            );
    
            if (resultado.rows.length === 0) {
                return res.status(404).json({ erro: "Chamado não encontrado" });
            }
    
            return res.status(200).json({ mensagem: "Chamado excluído com sucesso" });
        } catch (erro) {
            next(erro)
        }
    });

    const rotaNaoEncontrada = (req, res, next) => {
        return res.status(404).json({ erro: "Rota não encontrada" });
    };
    
    const tratarErros = (err, req, res, next) => {
        console.log(err);
        return res.status(500).json({ erro: "Erro interno do servidor" });
    };
    
    app.use(rotaNaoEncontrada);
    app.use(tratarErros);


app.listen(3000, () => console.log("Servidor rodando na porta 3000"));