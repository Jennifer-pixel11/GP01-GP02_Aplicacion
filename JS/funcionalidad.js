// Objeto para almacenar los saldos de cada cuenta
const cuentas = {
    "Ventas": { saldo: 0 },
    "Compras": { saldo: 0 },
    "Gastos": { saldo: 0 },
    "Ingresos": { saldo: 0 }
};

// Función para agregar nuevas cuentas
function addNewAccount() {
    const newAccount = prompt("Ingrese el nombre de la nueva cuenta:");
    if (newAccount && !cuentas[newAccount]) {
        cuentas[newAccount] = { saldo: 0 };
        const cuentaSelect = document.getElementById("cuenta");
        const option = document.createElement("option");
        option.value = newAccount;
        option.text = newAccount;
        cuentaSelect.add(option);
    }
}

// Función para agregar una entrada en el Libro Diario y actualizar el saldo en el Libro Mayor
function addDiaryEntry(event) {
    event.preventDefault();
    const fecha = document.getElementById("fecha").value;
    const codigoCuenta = document.getElementById("codigoCuenta").value;
    const cuenta = document.getElementById("cuenta").value;
    const debito = parseFloat(document.getElementById("debito").value) || 0;
    const credito = parseFloat(document.getElementById("credito").value) || 0;

    const table = document.getElementById("diaryTable").getElementsByTagName("tbody")[0];
    
    // Validar si existe una entrada con la misma fecha
    let existingRow = Array.from(table.rows).find(row => row.cells[0].innerText === fecha);

    if (!existingRow) {
        const newRow = table.insertRow();
        newRow.insertCell(0).innerText = fecha;
        newRow.insertCell(1).innerText = codigoCuenta;
        newRow.insertCell(2).innerText = cuenta;
        newRow.insertCell(3).innerText = debito.toFixed(2);
        newRow.insertCell(4).innerText = credito.toFixed(2);
    } else {
        const newRow = table.insertRow();
        newRow.insertCell(0).innerText = ""; // Dejar vacío si es la misma fecha
        newRow.insertCell(1).innerText = codigoCuenta;
        newRow.insertCell(2).innerText = cuenta;
        newRow.insertCell(3).innerText = debito.toFixed(2);
        newRow.insertCell(4).innerText = credito.toFixed(2);
    }

    // Actualizar saldo en el objeto cuentas
    if (cuenta in cuentas) {
        cuentas[cuenta].saldo += debito - credito;
    } else {
        alert("La cuenta especificada no existe.");
    }

    // Llamar a la función para actualizar el Libro Mayor
    updateMayorTable();
    
    document.getElementById("diaryForm").reset();
}

// Función para actualizar el Libro Mayor en la tabla HTML
function updateMayorTable() {
    const mayorTableBody = document.querySelector('#mayorTable tbody');
    mayorTableBody.innerHTML = ''; // Limpiar la tabla anterior

    for (const [cuenta, { saldo }] of Object.entries(cuentas)) {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${cuenta}</td><td>${saldo.toFixed(2)}</td>`; // Uso de comillas adecuadas
        mayorTableBody.appendChild(row);
    }
}
function addSalesEntry(event) {
    event.preventDefault();
    const fechaVenta = document.getElementById("fechaVenta").value;
    const clienteVenta = document.getElementById("clienteVenta").value;
    const montoVenta = parseFloat(document.getElementById("montoVenta").value) || 0;

    const table = document.getElementById("salesTable").getElementsByTagName("tbody")[0];
    const newRow = table.insertRow();
    newRow.insertCell(0).innerText = fechaVenta;
    newRow.insertCell(1).innerText = clienteVenta;
    newRow.insertCell(2).innerText = montoVenta;

    cuentas["Ventas"].saldo += montoVenta;
    updateMayorTable();

    document.getElementById("salesForm").reset();
}

function addPurchaseEntry(event) {
    event.preventDefault();
    const fechaCompra = document.getElementById("fechaCompra").value;
    const proveedorCompra = document.getElementById("proveedorCompra").value;
    const montoCompra = parseFloat(document.getElementById("montoCompra").value) || 0;

    const table = document.getElementById("purchaseTable").getElementsByTagName("tbody")[0];
    const newRow = table.insertRow();
    newRow.insertCell(0).innerText = fechaCompra;
    newRow.insertCell(1).innerText = proveedorCompra;
    newRow.insertCell(2).innerText = montoCompra;

    cuentas["Compras"].saldo += montoCompra;
    updateMayorTable();

    document.getElementById("purchaseForm").reset();
}



function exportAllToExcel() {
    const wb = XLSX.utils.book_new();

    // Función para aplicar estilos a las celdas
    const applyCellStyle = (worksheet, cellRef, style) => {
        if (!worksheet[cellRef]) worksheet[cellRef] = {};
        worksheet[cellRef].s = style;
    };

    // Estilo general
    const generalCellStyle = {
        font: {
            color: { rgb: "000000" },
            size: 12,
            bold: false,
            name: 'Arial'
        },
        alignment: {
            horizontal: "center",
            vertical: "center"
        }
    };

    // Libro Diario
    const diaryData = [];
    const diaryHeaders = ["Fecha", "Código Cuenta", "Cuenta", "Débito", "Crédito"];
    diaryData.push(diaryHeaders);
    document.querySelectorAll('#diaryTable tbody tr').forEach(row => {
        const rowData = Array.from(row.children).map(cell => cell.textContent);
        diaryData.push(rowData);
    });
    const diaryWorksheet = XLSX.utils.aoa_to_sheet(diaryData);

    // Estilo para el Libro Diario
    const diaryHeaderStyle = {
        fill: {
            patternType: "solid",
            fgColor: { rgb: "FFDDDD" } // Color de fondo
        },
        font: {
            bold: true,
            color: { rgb: "000000" },
            size: 14
        },
        alignment: {
            horizontal: "center"
        }
    };

    // Aplica el estilo a las celdas del encabezado
    for (let col = 0; col < diaryHeaders.length; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
        applyCellStyle(diaryWorksheet, cellRef, diaryHeaderStyle);
    }

    // Estilo a las filas de datos
    for (let row = 1; row < diaryData.length; row++) {
        for (let col = 0; col < diaryHeaders.length; col++) {
            const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
            applyCellStyle(diaryWorksheet, cellRef, generalCellStyle);
        }
    }

    XLSX.utils.book_append_sheet(wb, diaryWorksheet, "Libro Diario");

    // Libro Mayor
    const mayorData = [];
    const mayorHeaders = ["Cuenta", "Saldo"];
    mayorData.push(mayorHeaders);
    for (const [cuenta, { saldo }] of Object.entries(cuentas)) {
        mayorData.push([cuenta, saldo.toFixed(2)]);
    }
    const mayorWorksheet = XLSX.utils.aoa_to_sheet(mayorData);
    
    // Aplica estilos similares al Libro Mayor
    const mayorHeaderStyle = {
        fill: {
            patternType: "solid",
            fgColor: { rgb: "DDFFDD" } // Color de fondo
        },
        font: {
            bold: true,
            color: { rgb: "000000" },
            size: 14
        },
        alignment: {
            horizontal: "center"
        }
    };

    for (let col = 0; col < mayorHeaders.length; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
        applyCellStyle(mayorWorksheet, cellRef, mayorHeaderStyle);
    }

    for (let row = 1; row < mayorData.length; row++) {
        for (let col = 0; col < mayorHeaders.length; col++) {
            const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
            applyCellStyle(mayorWorksheet, cellRef, generalCellStyle);
        }
    }

    XLSX.utils.book_append_sheet(wb, mayorWorksheet, "Libro Mayor");

    // Libro de Ventas
    const salesData = [];
    const salesHeaders = ["Fecha", "Cliente", "Monto"];
    salesData.push(salesHeaders);
    document.querySelectorAll('#salesTable tbody tr').forEach(row => {
        const rowData = Array.from(row.children).map(cell => cell.textContent);
        salesData.push(rowData);
    });
    const salesWorksheet = XLSX.utils.aoa_to_sheet(salesData);
    
    // Aplicar estilos para ventas
    const salesHeaderStyle = {
        fill: {
            patternType: "solid",
            fgColor: { rgb: "DDDDFF" }
        },
        font: {
            bold: true,
            color: { rgb: "000000" },
            size: 14
        },
        alignment: {
            horizontal: "center"
        }
    };

    for (let col = 0; col < salesHeaders.length; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
        applyCellStyle(salesWorksheet, cellRef, salesHeaderStyle);
    }

    for (let row = 1; row < salesData.length; row++) {
        for (let col = 0; col < salesHeaders.length; col++) {
            const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
            applyCellStyle(salesWorksheet, cellRef, generalCellStyle);
        }
    }
    
    XLSX.utils.book_append_sheet(wb, salesWorksheet, "Libro de Ventas");

    // Libro de Compras
    const purchaseData = [];
    const purchaseHeaders = ["Fecha", "Proveedor", "Monto"];
    purchaseData.push(purchaseHeaders);
    document.querySelectorAll('#purchaseTable tbody tr').forEach(row => {
        const rowData = Array.from(row.children).map(cell => cell.textContent);
        purchaseData.push(rowData);
    });
    const purchaseWorksheet = XLSX.utils.aoa_to_sheet(purchaseData);

    // Aplicar estilos para compras
    const purchaseHeaderStyle = {
        fill: {
            patternType: "solid",
            fgColor: { rgb: "FFFFDD" }
        },
        font: {
            bold: true,
            color: { rgb: "000000" },
            size: 14
        },
        alignment: {
            horizontal: "center"
        }
    };

    for (let col = 0; col < purchaseHeaders.length; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
        applyCellStyle(purchaseWorksheet, cellRef, purchaseHeaderStyle);
    }

    for (let row = 1; row < purchaseData.length; row++) {
        for (let col = 0; col < purchaseHeaders.length; col++) {
            const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
            applyCellStyle(purchaseWorksheet, cellRef, generalCellStyle);
        }
    }

    XLSX.utils.book_append_sheet(wb, purchaseWorksheet, "Libro de Compras");

    // Descargar el archivo
    XLSX.writeFile(wb, 'Catálogo_de_Cuentas_Gimnasio.xlsx');
}
async function exportToPDF() {
    const { jsPDF } = window.jspdf;

    // Crear una instancia de jsPDF
    const doc = new jsPDF();

    // Capturar el Libro Diario
    const diaryTable = document.getElementById("diaryTable");
    const diaryCanvas = await html2canvas(diaryTable);
    const diaryImageData = diaryCanvas.toDataURL("image/png");
    doc.addImage(diaryImageData, "PNG", 10, 10, 190, 0); // Ajusta la posición y tamaño según sea necesario

    // Agregar una nueva página para el Libro Mayor
    doc.addPage();
    const mayorTable = document.getElementById("mayorTable");
    const mayorCanvas = await html2canvas(mayorTable);
    const mayorImageData = mayorCanvas.toDataURL("image/png");
    doc.addImage(mayorImageData, "PNG", 10, 10, 190, 0); // Ajusta la posición y tamaño según sea necesario

    // Agregar una nueva página para el Libro de Ventas
    doc.addPage();
    const salesTable = document.getElementById("salesTable");
    const salesCanvas = await html2canvas(salesTable);
    const salesImageData = salesCanvas.toDataURL("image/png");
    doc.addImage(salesImageData, "PNG", 10, 10, 190, 0); // Ajusta la posición y tamaño según sea necesario

    // Agregar una nueva página para el Libro de Compras
    doc.addPage();
    const purchaseTable = document.getElementById("purchaseTable");
    const purchaseCanvas = await html2canvas(purchaseTable);
    const purchaseImageData = purchaseCanvas.toDataURL("image/png");
    doc.addImage(purchaseImageData, "PNG", 10, 10, 190, 0); // Ajusta la posición y tamaño según sea necesario

    // Descargar el PDF
    doc.save('Catalogo_de_Cuentas_Gimnasio.pdf');
}
