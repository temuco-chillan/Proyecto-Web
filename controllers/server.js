//usaremos express para montar el servicio web 
//usaremos fs para leer archivos del directorio  FYLE SYSTEM
//manipularemos path para movernos en los directorios 

//importamos lo necesario
const express =require('express');
const fs =require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

const DATA_FILE = path.join(__dirname, '../models/Productos/computadores.json');

app.use(express.json());

//podemos manipular este para movernos entre el directorio public y el user
//en caso de colocar user cambiar el url a http://localhost:3000/index_user.html
app.use(express.static('public/views'));

// leemos los datos
app.get('/api/products',(req,res)=>{
    //convertimos el json en un archivo que leera en utf-8
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    res.json(data);
});

//declaramos que los post son para crear un producto
app.post('/api/products',(req,res)=>{
    const data = JSON.parse (fs.readFileSync(DATA_FILE,'utf8'));
    data.push(req.body);
    fs.writeFileSync(DATA_FILE,JSON.stringify(data,null,2));
    res.status(201).json({message:'producto agregado'});
});

// declaramos que los put son para actualizar los productos
app.put('/api/products/:index',(req,res)=>{
    const data = JSON.parse(fs.readFileSync(DATA_FILE,'utf8'));
    const index = parseInt(req.params.index);
    data[index] = req.body;
    fs.writeFileSync(DATA_FILE,JSON.stringify(data,null,2));
    res.json({message:'producto agregado'});
});

//declaramos el metodo put para que funcione como un delete
app.delete('/api/products/:index', (req,res) =>{
    const data = JSON.parse(fs.readFileSync(DATA_FILE,'utf8'));
    const index = parseInt(req.params.index);
    data.splice(index, 1);
    fs.writeFileSync(DATA_FILE,JSON.stringify(data,null,2));
    res.json({message:'producto eliminado'});
});

app.listen(PORT,() =>{
    console.log(`servidor corriendo en http://localhost:${PORT}`);
})