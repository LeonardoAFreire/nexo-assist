import type { Article } from '../../core/article.js';

export const workplaceArticles: Article[] = [
  {
    id: 'horario-service-desk',
    title: 'Horário do service desk',
    body: 'O service desk de TI atende de segunda a sexta-feira, das 8h às 18h, no horário de Brasília, exceto feriados. Chamados críticos têm plantão 24 horas. Fora desse horário, os demais chamados abertos são tratados no próximo dia útil, e os prazos de atendimento contam apenas o expediente.',
    conditions: null,
    category: 'other',
  },
  {
    id: 'troca-senha-rede',
    title: 'Troca de senha da rede',
    body: 'Para trocar a senha da rede, acesse o portal de autoatendimento, escolha Alterar senha e informe a senha atual. A nova senha precisa ter ao menos 12 caracteres, com letras e números. Quem esqueceu a senha atual deve abrir um chamado de acesso para a redefinição.',
    conditions: null,
    category: 'access',
  },
  {
    id: 'outlook-nao-sincroniza-celular',
    title: 'Outlook não sincroniza no celular',
    body: 'Se o e-mail parou de chegar no celular, abra o aplicativo do Outlook, entre em Configurações, toque na conta corporativa e selecione Redefinir conta. Confirme também se o celular tem internet e se a senha da rede foi trocada recentemente, pois nesse caso é preciso entrar de novo.',
    conditions: null,
    category: 'email',
  },
  {
    id: 'acesso-pastas-sharepoint',
    title: 'Acesso a pastas do SharePoint',
    body: 'O acesso a uma pasta do SharePoint é liberado pelo proprietário do site. Peça a liberação ao responsável da área pelo botão Solicitar acesso na própria pasta. Se o proprietário não souber quem aprova, abra um chamado de acesso citando o endereço da pasta.',
    conditions: null,
    category: 'access',
  },
];
