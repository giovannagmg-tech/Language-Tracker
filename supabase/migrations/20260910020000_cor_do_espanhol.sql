-- A cor do espanhol no banco (#E4A11B) tem contraste 2,23 contra o fundo claro.
-- Uma forma precisa de 3:1 para ser vista — a barra do espanhol some no tema
-- claro. O `docs/07` já fixava #C08A12, que alcança 3,05; o seed é que tinha
-- divergido. Alinhando o dado ao documento.
update idiomas set cor = '#C08A12' where slug = 'espanhol' and cor = '#E4A11B';
