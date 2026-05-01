import React, { useState, useRef, useEffect } from "react";
import "../../styles/components.css";
import { Search } from "lucide-react";

const categories = [
  "All Categories",
  "Cars",
  "Motorcycles",
  "Mobile Phones",
  "For Sale: Houses & Apartments",
  "Scooters",
  "Commercial & Other Vehicles",
  "For Rent: Houses & Apartments",
];

export default function SearchBar({ onSearch = () => { } }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  function submit(e) {
    e?.preventDefault();
    onSearch({ q: query.trim(), category });
  }

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <form className="dm-searchbar" role="search" onSubmit={submit}>
      <div className="dm-input-wrapper">
        <input
          ref={inputRef}
          className="dm-search-input"
          type="search"
          placeholder='Search "Properties"'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search products, categories and more"
        />

        <button className="dm-search-btn" type="submit" aria-label="Search">
          <Search size={18} strokeWidth={2.5} />
        </button>
      </div>
    </form>
  );
}
