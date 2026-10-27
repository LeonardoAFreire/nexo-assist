import type { Article } from '../../core/article.js';

export const networkArticles: Article[] = [
  {
    id: 'vpn-erro-809',
    title: 'VPN com erro 809',
    body: 'O erro 809 indica que a conexão com a VPN foi bloqueada antes de chegar ao servidor. Reinstale o cliente de VPN pelo portal de softwares, reinicie o computador e conecte de novo. Se a rede doméstica usar um roteador antigo, tente também conectar pelo roteamento de dados do celular.',
    conditions: 'Vale apenas para Windows 10; no Windows 11, abra um chamado.',
    category: 'network_vpn',
  },
  {
    id: 'wifi-visitantes',
    title: 'Wi-Fi de visitantes',
    body: 'Visitantes se conectam à rede Nexo-Visitantes, que dá acesso apenas à internet. A senha muda toda segunda-feira e fica disponível na recepção de cada andar. O acesso expira ao fim do dia e não alcança sistemas internos nem a VPN.',
    conditions: null,
    category: 'network_vpn',
  },
  {
    id: 'impressora-nao-imprime',
    title: 'Impressora não imprime',
    body: 'Confira se a impressora está ligada e com papel, cancele os trabalhos parados na fila de impressão e imprima uma página de teste. Se a fila continuar travada, remova a impressora e adicione de novo pelo portal de softwares. Persistindo o problema, abra um chamado informando o modelo e o andar.',
    conditions: null,
    category: 'hardware',
  },
  {
    id: 'instalar-software-portal',
    title: 'Instalar software pelo portal',
    body: 'Os programas homologados estão no portal de softwares, disponível no menu Iniciar. Escolha o programa, selecione Instalar e aguarde a confirmação. Programas fora da lista dependem de aprovação do gestor e devem ser pedidos por um chamado de requisição.',
    conditions: null,
    category: 'software',
  },
];
