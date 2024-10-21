# Autocomplete Functions for Fluig

Este repositório contém duas funções principais `autocompleteEmpresas` e `autocompleteSetores`, desenvolvidas para fornecer funcionalidades de autocomplete em campos de formulário Fluig, com configurações flexíveis que permitem personalização por meio de parâmetros.

## Funções Disponíveis

- `autocompleteEmpresas`: Autocomplete de empresas, com funcionalidades para selecionar e remover empresas associadas a um campo.
- `autocompleteSetores`: Autocomplete de setores, permitindo buscar e associar setores com base na empresa selecionada.

---

## 1. Função: `autocompleteEmpresas`

### Descrição

A função `autocompleteEmpresas` habilita o autocomplete para o campo de seleção de empresas, permitindo a busca e seleção de uma empresa de forma dinâmica. Ela também facilita a integração com o autocomplete de setores automaticamente quando uma empresa é selecionada.

### Parâmetros de Configuração

A função aceita um objeto `settings` com as seguintes propriedades:

| Parâmetro               | Tipo        | Descrição                                                                                       | Padrão                          |
|-------------------------|-------------|-------------------------------------------------------------------------------------------------|---------------------------------|
| `empresaField`           | `string`    | ID do campo de input onde será aplicado o autocomplete de empresas.                              | `"#nomeEmpresaSolicitante"`     |
| `codEmpVariavel`         | `string`    | ID do campo para armazenar o código da empresa selecionada.                                      | `"#codEmpresaSolicitante"`      |
| `codSetorField`          | `string`    | ID do campo para armazenar o código do setor.                                                    | `"#codSetorSolicitante"`        |
| `setorField`             | `string`    | ID do campo para armazenar o nome do setor.                                                      | `"#nomeSetorSolicitante"`       |
| `mensagemErro`           | `string`    | Mensagem exibida ao tentar adicionar uma empresa já selecionada.                                 | `"A empresa já está selecionada!"` |
| `maxTags`                | `number`    | Limite de tags (número máximo de empresas que podem ser selecionadas).                           | `1`                             |
| `urlBase`                | `string`    | URL base para buscar as empresas via API.                                                        | `"/api/public/2.0/groups/findGroupsByUser/"` |
| `solicitanteId`          | `string`    | ID do campo que armazena o código do solicitante (para a consulta de empresas).                   | `"#codSolicitante"`             |
| `readOnly`               | `boolean`   | Define se o campo será apenas leitura (`true`) ou editável (`false`).                             | `false`                         |
| `addConfigSelectEmpresa` | `function`  | Função adicional executada ao selecionar uma empresa (callback).                                  | `function () {}`                |
| `addConfigRemoveEmpresa` | `function`  | Função adicional executada ao remover uma empresa (callback).                                     | `function () {}`                |
| `selectEmpresa`          | `function`  | Função que executa a lógica ao adicionar uma empresa (pode ser personalizada).                    | Seleciona a empresa e chama `autocompleteSetores()` |
| `removeEmpresa`          | `function`  | Função que executa a lógica ao remover uma empresa (pode ser personalizada).                      | Limpa os campos de empresa e setor |

### Exemplo de Uso

~~~javascript
autocompleteEmpresas({
    empresaField: "#nomeEmpresaSolicitante",
    codEmpVariavel: "#codEmpresaSolicitante",
    codSetorField: "#codSetorSolicitante",
    setorField: "#nomeSetorSolicitante",
    maxTags: 1,
    mensagemErro: "A empresa já está selecionada!",
    addConfigSelectEmpresa: function() {
        console.log("Empresa selecionada!");
    },
    addConfigRemoveEmpresa: function() {
        console.log("Empresa removida!");
    }
});
~~~


### Função: `autocompleteSetores`

### Descrição
A função `autocompleteSetores` habilita o autocomplete de setores com base na empresa selecionada. Ela permite buscar setores por código de solicitante e associá-los ao campo de setor.

### Parâmetros de Configuração
A função aceita um objeto `settings` com as seguintes propriedades:

| Parâmetro         | Tipo       | Descrição                                                          | Padrão                     |
|-------------------|------------|--------------------------------------------------------------------|----------------------------|
| `codSetorField`    | `string`   | ID do campo que armazena o código do setor selecionado.             | `"#codSetorSolicitante"`    |
| `setorField`       | `string`   | ID do campo de input onde será aplicado o autocomplete de setores.  | `"#nomeSetorSolicitante"`   |
| `codigoSolicitante`| `string`   | Código do solicitante (empresa) que será usado para buscar os setores. | `"#_COD_SOLIC"`          |
| `maxTags`          | `number`   | Limite de tags (número máximo de setores que podem ser selecionados). | `1`                        |
| `onItemAdded`      | `function` | Função executada ao adicionar um setor (callback).                   | Atualiza o campo com o código do setor |
| `onItemRemoved`    | `function` | Função executada ao remover um setor (callback).                     | Limpa o campo de código do setor |

### Exemplo de Uso

```javascript
autocompleteSetores({
    codSetorField: "#codSetorSolicitante",
    setorField: "#nomeSetorSolicitante",
    codigoSolicitante: "#_COD_SOLIC",
    maxTags: 1,
    onItemAdded: function(event) {
        console.log("Setor selecionado:", event.item);
    },
    onItemRemoved: function() {
        console.log("Setor removido.");
    }
});


