export const PaginationCustom = ({ length, onSelect }: { length: number, onSelect: (index: number) => void }) => {

    return (
        <div className="flex">
            {
                Array(length).fill(null).map((_, index) => (
                    <a onClick={() => { onSelect(index) }} key={index + Date.now()} href="#" className="items-center hidden px-4 py-2 mx-1 text-gray-700 transition-colors duration-300 transform bg-white rounded-md sm:flex hover:bg-blue-600 hover:text-white">
                        {index}
                    </a>
                ))
            }
        </div>                
    );
}