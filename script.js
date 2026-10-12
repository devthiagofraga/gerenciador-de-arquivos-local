// Variável que guardará a estrutura e referências de pastas reais
let currentRealDirectoryHandle = null;
let directoryHistory = []; // Histórico para o Breadcrumb e navegação de retorno

// Elementos do DOM
const fileExplorer = document.getElementById("file-explorer");
const breadcrumb = document.getElementById("breadcrumb");
const btnNovaPasta = document.getElementById("btn-nova-pasta");
const btnNovoArquivo = document.getElementById("btn-novo-arquivo");
const btnAbrirPasta = document.getElementById("btn-abrir-pasta");
const btnVoltar = document.getElementById("btn-voltar");

// Função principal para renderizar a pasta atual do seu computador
async function renderRealDirectory() {
  fileExplorer.innerHTML = "";
  renderBreadcrumb();
  atualizarBotaoVoltar();

  if (!currentRealDirectoryHandle) {
    fileExplorer.innerHTML = `<p class="empty-message">Clique em "📂 Abrir Pasta Real" para selecionar uma pasta do seu computador.</p>`;
    return;
  }

  try {
    let itemsCount = 0;

    // Itera por todos os arquivos e subpastas existentes no diretório selecionado
    for await (const entry of currentRealDirectoryHandle.values()) {
      itemsCount++;
      const itemDiv = document.createElement("div");

      if (entry.kind === "directory") {
        itemDiv.classList.add("item", "folder");
        itemDiv.innerHTML = `<span>📁 ${entry.name}</span>`;

        // Duplo clique para ENTRAR na subpasta real
        itemDiv.addEventListener("dblclick", async () => {
          directoryHistory.push(currentRealDirectoryHandle);
          currentRealDirectoryHandle = entry; // Navega para a subpasta
          await renderRealDirectory();
        });
      } else if (entry.kind === "file") {
        itemDiv.classList.add("item", "file");
        itemDiv.innerHTML = `<span>📄 ${entry.name}</span>`;

        // Clique para ler e exibir o conteúdo do arquivo real
        itemDiv.addEventListener("click", async () => {
          try {
            const fileData = await entry.getFile();
            const text = await fileData.text();
            alert(`Conteúdo do arquivo "${entry.name}":\n\n${text}`);
          } catch (err) {
            alert(`Não foi possível ler o arquivo ${entry.name} em texto.`);
          }
        });
      }

      fileExplorer.appendChild(itemDiv);
    }

    if (itemsCount === 0) {
      fileExplorer.innerHTML = `<p class="empty-message">Esta pasta real está vazia.</p>`;
    }
  } catch (error) {
    console.error("Erro ao ler os arquivos do diretório:", error);
    alert("Erro ao carregar os arquivos da pasta.");
  }
}

// Atualiza a barra de navegação superior (Breadcrumb)
function renderBreadcrumb() {
  breadcrumb.innerHTML = "";

  if (!currentRealDirectoryHandle) {
    breadcrumb.innerHTML = "<span>Raiz /</span>";
    return;
  }

  // Cria o caminho com os nomes das pastas no histórico
  directoryHistory.forEach((handle, index) => {
    const span = document.createElement("span");
    span.style.cursor = "pointer";
    span.style.color = "#3498db";
    span.innerText = `${handle.name} / `;

    // Permite clicar em qualquer pasta do caminho para voltar diretamente a ela
    span.addEventListener("click", async () => {
      currentRealDirectoryHandle = handle;
      directoryHistory = directoryHistory.slice(0, index);
      await renderRealDirectory();
    });

    breadcrumb.appendChild(span);
  });

  // Nome da pasta atual (não clicável)
  const currentSpan = document.createElement("span");
  currentSpan.style.fontWeight = "bold";
  currentSpan.innerText = currentRealDirectoryHandle.name;
  breadcrumb.appendChild(currentSpan);
}

// Habilita ou desabilita o botão de voltar com base no histórico
function atualizarBotaoVoltar() {
  if (directoryHistory.length > 0) {
    btnVoltar.disabled = false;
    btnVoltar.style.opacity = "1";
    btnVoltar.style.cursor = "pointer";
  } else {
    btnVoltar.disabled = true;
    btnVoltar.style.opacity = "0.5";
    btnVoltar.style.cursor = "not-allowed";
  }
}

// 1. AÇÃO: Botão Voltar (Navega para a pasta pai)
btnVoltar.addEventListener("click", async () => {
  if (directoryHistory.length > 0) {
    // Remove a pasta anterior do histórico e define como a pasta atual
    currentRealDirectoryHandle = directoryHistory.pop();
    await renderRealDirectory();
  }
});

// 2. AÇÃO: Abrir Pasta Real do Computador
btnAbrirPasta.addEventListener("click", async () => {
  try {
    const handle = await window.showDirectoryPicker();
    currentRealDirectoryHandle = handle;
    directoryHistory = []; // Reinicia o histórico ao abrir uma nova pasta raiz
    await renderRealDirectory();
  } catch (error) {
    console.log("Seleção de pasta cancelada ou não suportada.", error);
  }
});

// 3. AÇÃO: Criar Pasta REAL no Computador
btnNovaPasta.addEventListener("click", async () => {
  if (!currentRealDirectoryHandle) {
    alert(
      'Por favor, abra uma pasta real do seu computador primeiro usando o botão "📂 Abrir Pasta Real".',
    );
    return;
  }

  const folderName = prompt("Digite o nome da nova pasta:");
  if (!folderName || folderName.trim() === "") return;

  try {
    await currentRealDirectoryHandle.getDirectoryHandle(folderName.trim(), {
      create: true,
    });
    alert(`Pasta "${folderName.trim()}" criada com sucesso no seu computador!`);
    await renderRealDirectory();
  } catch (error) {
    console.error("Erro ao criar pasta no disco:", error);
    alert("Erro ao criar a pasta no seu computador.");
  }
});

// 4. AÇÃO: Criar Arquivo REAL no Computador
btnNovoArquivo.addEventListener("click", async () => {
  if (!currentRealDirectoryHandle) {
    alert(
      'Por favor, abra uma pasta real do seu computador primeiro usando o botão "📂 Abrir Pasta Real".',
    );
    return;
  }

  const fileName = prompt("Digite o nome do arquivo (ex: teste.txt):");
  if (!fileName || fileName.trim() === "") return;

  try {
    const fileHandle = await currentRealDirectoryHandle.getFileHandle(
      fileName.trim(),
      { create: true },
    );
    const writable = await fileHandle.createWritable();
    await writable.write(
      `Arquivo criado pelo Gerenciador de Arquivos do Thiago Fraga em ${new Date().toLocaleString()}`,
    );
    await writable.close();

    alert(`Arquivo "${fileName.trim()}" criado com sucesso no seu computador!`);
    await renderRealDirectory();
  } catch (error) {
    console.error("Erro ao criar arquivo no disco:", error);
    alert("Erro ao criar o arquivo no seu computador.");
  }
});

// Execução inicial
renderRealDirectory();
