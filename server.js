import express from 'express';
const app = express();

const registrarRequisicao = (req, res, next) => {
    console.log(`Método: ${req.method}`);
    console.log(`URL: ${req.url}`);
  
    next();
};
  




app.use(express.json());
app.use(registrarRequisicao);


app.get('/usuarios', (req, res) => {
    res.json({ mensagem: 'Lista de usuários' });
});

app.listen(3333, () => console.log("Servidor rodando na porta 3333"));