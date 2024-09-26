import React, { useState, useEffect, useMemo, useRef } from 'react'
import { MaterialReactTable } from 'material-react-table'
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material'
import Papa from 'papaparse'

const AccountsScreen = () => {
  const [data, setData] = useState([])
  const [columns, setColumns] = useState([])
  const [error, setError] = useState(null)
  const [csvPath, setCsvPath] = useState('')
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  })
  const tableInstanceRef = useRef(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.api) {
      console.log('window.api is available:', window.api)
      fetchData()
    } else {
      console.error('window.api is not available')
    }
  }, [])

  const fetchData = async () => {
    if (typeof window === 'undefined' || !window.api) {
      console.log(await window.api)
      console.error('window.api is not available')
      return
    }

    try {
      if (!window.api || typeof window.api.readFile !== 'function') {
        throw new Error('window.api.readFile is not available')
      }

      // Use the new IPC method to get the CSV path
      const filePath = await window.api.getResourcePath('account_settings3.csv')
      console.log(filePath)
      setCsvPath(filePath)

      const csvText = await window.api.readFile(filePath)
      const result = Papa.parse(csvText, { header: true })

      if (result.data && result.data.length > 0) {
        setData(result.data)
        setColumns(
          Object.keys(result.data[0]).map((key) => ({
            accessorKey: key,
            header: key,
            enableEditing: true
          }))
        )
      }
    } catch (error) {
      console.error('Error fetching CSV:', error)
      setError(error.message)
    }
  }

  const handleSaveRow = async ({ row, values, table }) => {
    setData((prev) => prev.map((item, index) => (index === row.index ? values : item)))
    table.setEditingRow(null)

    // Manually set the pagination after edit
    setTimeout(() => {
      if (tableInstanceRef.current) {
        tableInstanceRef.current.setPageIndex(pagination.pageIndex)
      }
    }, 0)
  }

  const handleSaveAll = async () => {
    try {
      // Convert data back to CSV
      const csv = Papa.unparse(data)

      // Save CSV back to file
      await window.api.writeFile('account_settings3.csv', csv)

      alert('Changes saved successfully!')
    } catch (error) {
      console.error('Error saving CSV:', error)
      setError('Failed to save changes: ' + error.message)
    }
  }

  const handleCreateRow = () => {
    const newRow = columns.reduce((acc, column) => {
      acc[column.accessorKey] = ''
      return acc
    }, {})
    setData([...data, newRow])

    setTimeout(() => {
      if (tableInstanceRef.current) {
        const table = tableInstanceRef.current
        table.setPageIndex(Math.floor(data.length / pagination.pageSize))
        table.setEditingRow(data.length)
      }
    }, 0)
  }

  const handleDeleteRow = (row) => {
    if (window.confirm(`Are you sure you want to delete this account?`)) {
      setData((prevData) => prevData.filter((_, index) => index !== row.index))
    }
  }

  const tableColumns = useMemo(() => columns, [columns])

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Accounts</h1>
      {tableColumns.length > 0 ? (
        <>
          <div className="flex-grow overflow-auto">
            <MaterialReactTable
              columns={tableColumns}
              data={data}
              enableEditing
              onEditingRowSave={handleSaveRow}
              enableColumnFilters
              enableSorting
              enablePagination
              muiTableContainerProps={{ sx: { maxHeight: 'calc(100vh - 200px)' } }}
              onPaginationChange={setPagination}
              state={{ pagination }}
              tableInstanceRef={tableInstanceRef}
              autoResetPageIndex={false}
              renderRowActions={({ row, table }) => (
                <div className="flex items-center">
                  <button
                    onClick={() => table.setEditingRow(row)}
                    className="p-1 text-blue-500 hover:text-blue-700"
                  >
                    <EditIcon />
                  </button>
                  <button
                    onClick={() => handleDeleteRow(row)}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <DeleteIcon />
                  </button>
                </div>
              )}
            />
          </div>
          <div className="mt-4 flex justify-between">
            <button
              onClick={handleCreateRow}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Add New Account
            </button>
            <button
              onClick={handleSaveAll}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              Save All Changes
            </button>
          </div>
        </>
      ) : (
        <p>Loading data...</p>
      )}
    </div>
  )
}

export default AccountsScreen
