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
    const token = req.headers.authorization;
    const usuario = usuarios.find((u) => u.token === token)

    if (!usuario) {
        return res.status(401).json({ erro: 'Usuário não autenticado' });
      }
    
      req.usuario = usuario
      next();
    };











    app.use(registrarRequisicao);







app.get('/chamados/:id', verificarAutenticacao, async (req, res) => {
    const id = Number(req.params.id);
    res.json(req.usuario);
    
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
        return res.status(500).json({erro: "Erro ao encontrar chamado."})
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
        return res.status(400).json({erro: "Erro ao cadastrar chamado."})
    }  
  });






  app.patch('/chamados/:id/assumir', async (req, res) => {
    
  })







app.listen(3000, () => console.log("Servidor rodando na porta 3000"));