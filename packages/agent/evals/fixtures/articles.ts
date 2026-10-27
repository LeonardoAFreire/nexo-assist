import type { ArticleExcerpt } from '@nexo/contracts';

export const evalArticles: ArticleExcerpt[] = [
  {
    id: 'vpn-erro-809',
    title: 'VPN com erro 809',
    excerpt:
      'O erro 809 indica que a conexão com a VPN foi bloqueada antes de chegar ao servidor. Reinstale o cliente de VPN pelo portal de softwares, reinicie o computador e conecte de novo. Se a rede doméstica usar um roteador antigo, tente também conectar pelo roteamento de dados do celular.',
    conditions: 'Vale apenas para Windows 10; no Windows 11, abra um chamado.',
    category: 'network_vpn',
  },
  {
    id: 'wifi-visitantes',
    title: 'Wi-Fi de visitantes',
    excerpt:
      'Visitantes se conectam à rede Nexo-Visitantes, que dá acesso apenas à internet. A senha muda toda segunda-feira e fica disponível na recepção de cada andar. O acesso expira ao fim do dia e não alcança sistemas internos nem a VPN.',
    conditions: null,
    category: 'network_vpn',
  },
  {
    id: 'impressora-nao-imprime',
    title: 'Impressora não imprime',
    excerpt:
      'Confira se a impressora está ligada e com papel, cancele os trabalhos parados na fila de impressão e imprima uma página de teste. Se a fila continuar travada, remova a impressora e adicione de novo pelo portal de softwares. Persistindo o problema, abra um chamado informando o modelo e o andar.',
    conditions: null,
    category: 'hardware',
  },
  {
    id: 'instalar-software-portal',
    title: 'Instalar software pelo portal',
    excerpt:
      'Os programas homologados estão no portal de softwares, disponível no menu Iniciar. Escolha o programa, selecione Instalar e aguarde a confirmação. Programas fora da lista dependem de aprovação do gestor e devem ser pedidos por um chamado de requisição.',
    conditions: null,
    category: 'software',
  },
  {
    id: 'horario-service-desk',
    title: 'Horário do service desk',
    excerpt:
      'O service desk de TI atende de segunda a sexta-feira, das 8h às 18h, no horário de Brasília, exceto feriados. Fora desse horário, os chamados abertos são tratados no próximo dia útil, e os prazos de atendimento contam apenas o expediente.',
    conditions: null,
    category: 'other',
  },
  {
    id: 'troca-senha-rede',
    title: 'Troca de senha da rede',
    excerpt:
      'Para trocar a senha da rede, acesse o portal de autoatendimento, escolha Alterar senha e informe a senha atual. A nova senha precisa ter ao menos 12 caracteres, com letras e números. Quem esqueceu a senha atual deve abrir um chamado de acesso para a redefinição.',
    conditions: null,
    category: 'access',
  },
  {
    id: 'outlook-nao-sincroniza-celular',
    title: 'Outlook não sincroniza no celular',
    excerpt:
      'Se o e-mail parou de chegar no celular, abra o aplicativo do Outlook, entre em Configurações, toque na conta corporativa e selecione Redefinir conta. Confirme também se o celular tem internet e se a senha da rede foi trocada recentemente, pois nesse caso é preciso entrar de novo.',
    conditions: null,
    category: 'email',
  },
  {
    id: 'acesso-pastas-sharepoint',
    title: 'Acesso a pastas do SharePoint',
    excerpt:
      'O acesso a uma pasta do SharePoint é liberado pelo proprietário do site. Peça a liberação ao responsável da área pelo botão Solicitar acesso na própria pasta. Se o proprietário não souber quem aprova, abra um chamado de acesso citando o endereço da pasta.',
    conditions: null,
    category: 'access',
  },
];
