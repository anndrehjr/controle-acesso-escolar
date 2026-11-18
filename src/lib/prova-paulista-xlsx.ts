import { strFromU8, unzipSync } from "fflate";

export type LinhaProvaPaulista = { turma: string; disciplina: string; percentual: number; bimestre: number };

const codigos = new Set(["GERAL", "MAT", "PORT", "ING", "HIST", "GEO", "CIE", "FILO", "SOC", "BIO", "FIS", "QUI", "FIN", "TEC"]);

function xml(bytes: Uint8Array) {
  return new DOMParser().parseFromString(strFromU8(bytes), "application/xml");
}

export async function lerPlanilhaProvaPaulista(file: File) {
  const arquivos = unzipSync(new Uint8Array(await file.arrayBuffer()));
  const workbook = xml(arquivos["xl/workbook.xml"]);
  const rels = xml(arquivos["xl/_rels/workbook.xml.rels"]);
  const destinos = new Map([...rels.getElementsByTagName("Relationship")].map((rel) => [rel.getAttribute("Id"), rel.getAttribute("Target") ?? ""]));
  const shared: string[] = arquivos["xl/sharedStrings.xml"]
    ? [...xml(arquivos["xl/sharedStrings.xml"]).getElementsByTagName("si")].map((si) => [...si.getElementsByTagName("t")].map((t) => t.textContent ?? "").join(""))
    : [];
  const linhas: LinhaProvaPaulista[] = [];
  let anoLetivo = new Date().getFullYear();

  for (const sheet of [...workbook.getElementsByTagName("sheet")]) {
    const nome = sheet.getAttribute("name") ?? "";
    const bimestre = Number(nome.match(/[1-4]/)?.[0]);
    if (!bimestre) continue;
    const relId = sheet.getAttribute("r:id") ?? sheet.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id");
    const destino = relId ? destinos.get(relId) : null;
    if (!destino) continue;
    const caminho = destino.startsWith("/") ? destino.slice(1) : `xl/${destino.replace(/^\.\//, "")}`;
    const sheetBytes = arquivos[caminho];
    if (!sheetBytes) continue;
    const doc = xml(sheetBytes);
    const porLinha = new Map<number, Map<string, string | number>>();
    for (const cell of [...doc.getElementsByTagName("c")]) {
      const ref = cell.getAttribute("r") ?? "";
      const row = Number(ref.match(/\d+/)?.[0]);
      const col = ref.match(/[A-Z]+/)?.[0] ?? "";
      const tipo = cell.getAttribute("t");
      const bruto = cell.getElementsByTagName("v")[0]?.textContent ?? "";
      let valor: string | number = bruto;
      if (tipo === "s") valor = shared[Number(bruto)] ?? "";
      else if (tipo === "inlineStr") valor = [...cell.getElementsByTagName("t")].map((t) => t.textContent ?? "").join("");
      else if (bruto !== "" && Number.isFinite(Number(bruto))) valor = Number(bruto);
      if (!porLinha.has(row)) porLinha.set(row, new Map());
      porLinha.get(row)!.set(col, valor);
    }
    const titulo = String(porLinha.get(1)?.get("A") ?? "");
    const anoEncontrado = Number(titulo.match(/20\d{2}/)?.[0]);
    if (anoEncontrado) anoLetivo = anoEncontrado;
    let disciplina = "";
    for (const numero of [...porLinha.keys()].sort((a, b) => a - b)) {
      const row = porLinha.get(numero)!;
      const a = String(row.get("A") ?? "").trim().toUpperCase().replace("FÍS", "FIS");
      if (codigos.has(a)) disciplina = a;
      const turma = String(row.get("B") ?? "").trim();
      const percentual = Number(row.get("C"));
      if (disciplina && turma && Number.isFinite(percentual) && percentual >= 0 && percentual <= 100) linhas.push({ turma, disciplina, percentual, bimestre });
    }
  }
  if (linhas.length === 0) throw new Error("Não encontrei resultados no formato esperado da Prova Paulista.");
  return { anoLetivo, linhas };
}
