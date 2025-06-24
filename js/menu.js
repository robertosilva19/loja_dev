// Código para js/menu.js

document.addEventListener('DOMContentLoaded', () => {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navContainer = document.querySelector('.cabecalho__nav');
    const icon = hamburgerBtn.querySelector('i');

    hamburgerBtn.addEventListener('click', () => {
        // Adiciona ou remove a classe que controla a exibição do menu
        navContainer.classList.toggle('mobile-menu-open');

        // Troca o ícone de hambúrguer para 'X' e vice-versa
        if (navContainer.classList.contains('mobile-menu-open')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });
});