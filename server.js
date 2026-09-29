import express from 'express';
import pool from './db.js';


const app = express();

const registrarRequisicao = (req, res, next) => {
    const agora = new Date();
    console.log(agora.toLocaleString());
    
    next();
}

const validarChamado = (req, res, next) => {
    const {titulo, descricao, setor, prioridade}

    if(titulo || descricao || setor || prioridade === ""){
        return res.status(400).json({
            erro: "Campo não preenchido."
        })
    }

    next()
}

const validarPrioridade = (req, res, next) => {
    
}




app.use(express.json());
app.use(registrarRequisicao);
app.use(validarChamado);


app.get('/chamados/:id', validarChamado, async (req, res) => {
    const id = Number(req.params.id);
    
    try{
        const resultado = await pool.query(`SELECT * FROM chamados WHERE id = $1`, [id])
        if (resultado.rows.length === 0) {
            return res.status(404).json({
                erro: "Chamado não encontrado"
            })
        }

        return res.status(201).json(resultado.rows)
    }
    catch(erro){
        return res.status(500).json({erro: "Erro ao encontrar chamado."})
    }
});

app.listen(3000, () => console.log("Servidor rodando na porta 3000"));