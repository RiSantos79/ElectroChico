import { getCustomerSessionToken } from "@/lib/customer-session";
import { getMyContactMessages } from "@/lib/api";
import { AccountAuthForm } from "@/components/account-auth-form";
import { AccountRma } from "@/components/account-rma";

export const metadata = { title: "Pedido de Devolução ou RMA — ElectroChico" };

export default async function AccountRmaPage() {
  const token = await getCustomerSessionToken();
  if (!token) return <AccountAuthForm />;

  const requests = await getMyContactMessages("RMA", token).catch(() => null);
  if (requests === null) return <AccountAuthForm />;

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-6 py-12 lg:px-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pedido de Devolução ou RMA</h1>

        <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted">
          <p>
            A ElectroChico dedica-se a oferecer a melhor experiência aos seus clientes, incluindo na política de
            assistência pós-venda. Antes de pedir uma devolução, tenha em conta que a Lei Portuguesa distingue uma
            compra à distância (online, entregue por transportadora) de uma compra levantada diretamente numa loja
            física.
          </p>

          <div>
            <h2 className="mb-1 font-semibold text-foreground">Como dar início ao processo</h2>
            <p>
              Preencha o formulário abaixo com a referência da encomenda (se tiver), o artigo e a descrição da
              avaria ou motivo da devolução. Vamos analisar o pedido e enviar-lhe instruções sobre os passos
              seguintes, incluindo, se necessário, como enviar o artigo para o nosso armazém.
            </p>
          </div>

          <div>
            <h2 className="mb-1 font-semibold text-foreground">O que não está coberto pela garantia</h2>
            <ul className="list-inside list-disc space-y-1">
              <li>O custo de transporte do material avariado.</li>
              <li>Danos provocados por uso indevido ou abusivo.</li>
              <li>Danos provocados por transporte fora das embalagens originais.</li>
              <li>Danos provocados por má proteção dos equipamentos.</li>
              <li>Equipamentos abertos por entidades estranhas à ElectroChico.</li>
              <li>Equipamentos que tenham sofrido tentativas de reparação fora dos nossos serviços de assistência.</li>
            </ul>
            <p className="mt-2">
              A ElectroChico não dá garantia, nem se responsabiliza por equipamentos danificados por deficiente
              manuseamento, instalação ou configuração. Qualquer alteração ao produto original invalida a garantia.
            </p>
          </div>

          <div>
            <h2 className="mb-1 font-semibold text-foreground">Garantia</h2>
            <ul className="list-inside list-disc space-y-1">
              <li>A ElectroChico é meramente distribuidora — a garantia é a do fabricante, transferida ao cliente no momento da venda.</li>
              <li>O regime legal de garantia para consumidores finais é de 2 anos. Após esse período, o processo é tratado diretamente entre cliente e fabricante.</li>
              <li>Para uso profissional (bem móvel), a garantia é de 6 meses, conforme Decreto-Lei nº47 344, de 24 de Novembro de 1966.</li>
              <li>Em computadores portáteis, cada fabricante poderá oferecer apenas 1 ano de garantia — confirme antes da compra.</li>
              <li>Certifique-se de que segue as instruções do fabricante antes de abrir um RMA; se o problema persistir, contacte-nos.</li>
              <li>O processo de RMA depende também de fabricantes/fornecedores, não apenas da ElectroChico — faremos o possível para ser rápido.</li>
              <li>Produtos descontinuados podem ser trocados por um equivalente ou superior, ou dar lugar a nota de crédito.</li>
              <li>
                Qualquer alteração ao produto original invalida a garantia (remoção de etiquetas/número de série,
                adulterações, componentes partidos, produtos incompletos, etc.) — nesses casos o RMA é recusado.
              </li>
              <li>Se o equipamento for testado e não apresentar avaria, ou a avaria resultar de utilização incorreta, pode ser cobrada uma taxa para cobrir custos logísticos.</li>
              <li>A ElectroChico não se responsabiliza pela perda de dados, programas ou software instalados nos produtos entregues para reparação.</li>
              <li>
                O prazo de levantamento de equipamentos reparados é de 90 dias após o aviso — passado esse prazo, o
                material considera-se abandonado nos termos do artigo 1267º/1a do Código Civil.
              </li>
            </ul>
          </div>

          <p>
            Dúvidas sobre a sua reparação? Contacte-nos em <span className="text-foreground">geral@electrochico.pt</span>.
          </p>
        </div>
      </div>

      <AccountRma requests={requests} />
    </div>
  );
}
