# AutoNote

Um caderno digital leve para escrever mensagens, organizar destinatários em folhas e abrir o envio diretamente no WhatsApp. A interface foi inspirada no clima acolhedor de jogos como Animal Crossing, com cores suaves, modo dia e modo noite.

## Funcionalidades

- Criação de várias folhas independentes.
- Telefone, prefixo internacional e mensagem salvos automaticamente.
- Máscara para números brasileiros quando o prefixo é `+55`.
- Validação de números nacionais e internacionais.
- Abertura da mensagem pronta no WhatsApp.
- Menu para visualizar, navegar e excluir folhas.
- Opção de desfazer exclusões durante a sessão atual.
- Modo dia e modo noite com preferência salva.
- Layout responsivo para celular, tablet e desktop.
- Navegação acessível por teclado.

## Como usar

1. Abra o arquivo `index.html` em um navegador moderno.
2. Clique em **Abrir meu caderno**.
3. Digite o prefixo do país, o telefone com código de área e a mensagem.
4. Clique em **Enviar recado** para abrir a conversa no WhatsApp.

O AutoNote é uma aplicação estática feita com HTML, CSS e JavaScript puro. Não é necessário instalar dependências nem configurar um backend.

## Armazenamento e privacidade

As folhas são armazenadas no `localStorage` do navegador. Nenhum texto ou telefone é enviado para um servidor do AutoNote.

Isso significa que:

- as notas ficam vinculadas ao navegador e ao endereço onde o site foi aberto;
- não existe sincronização entre dispositivos;
- limpar os dados do site pode apagar as notas;
- outras pessoas usando o mesmo perfil do navegador podem acessar o conteúdo salvo;
- notas criadas localmente não migram automaticamente para uma versão hospedada em outro endereço.

O botão de envio abre o WhatsApp com o telefone e a mensagem preenchidos. O usuário ainda confirma o envio dentro do próprio WhatsApp.

## Estrutura

```text
AutoNote/
├── index.html              # Estrutura da interface
├── style.css               # Temas e layout responsivo
├── script.js               # Folhas, armazenamento e integração com WhatsApp
├── favicon.svg             # Ícone vetorial
├── favicon-32.png          # Ícone para navegadores
├── apple-touch-icon.png    # Ícone para atalhos em dispositivos Apple
├── LICENSE
└── README.md
```

## Publicação

Por ser um site estático, o projeto pode ser publicado diretamente no GitHub Pages, Vercel, Netlify ou em qualquer hospedagem de arquivos estáticos. Publique todos os arquivos da raiz e use `index.html` como página inicial.

## Autor

Desenvolvido por [Gabriel Douglas — gabbdev](https://gabbdev.vercel.app/).

## Licença

Distribuído sob a licença MIT. Consulte o arquivo [LICENSE](LICENSE) para mais informações.

> WhatsApp é uma marca de seus respectivos proprietários. Este projeto não possui vínculo oficial com a plataforma.
