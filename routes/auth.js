const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Registro de usuário
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Verifica se o e-mail já está registrado
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'E-mail já registrado' });
        }

        // Cria um novo usuário
        const user = new User({ name, email, password });
        await user.save();

        res.status(201).json({ message: 'Usuário registrado com sucesso' });
    } catch (error) {
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

// Login de usuário
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Verifica se o usuário existe
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Credenciais inválidas' });
        }

        // Verifica a senha
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Credenciais inválidas' });
        }

        // Gera um token JWT
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ message: 'Login realizado com sucesso', token });
    } catch (error) {
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

// Rota para obter informações do usuário
router.get('/me', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        res.status(200).json({ name: user.name, email: user.email });
    } catch (error) {
        res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
});

// Rota para atualizar informações do usuário
router.put('/update', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        const { name, email, password } = req.body;

        // Atualiza os campos fornecidos
        if (name) user.name = name;
        if (email) user.email = email;
        if (password) user.password = password; // O middleware no modelo cuidará do hash

        await user.save();

        res.status(200).json({ message: 'Informações atualizadas com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar informações do usuário:', error);
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

module.exports = router;