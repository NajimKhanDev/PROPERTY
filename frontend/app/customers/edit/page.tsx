"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import axiosInstance from "@/app/api/axiosInstance";
import ProjectApi from "@/app/api/ProjectApis";

type FormValues = {
  name: string;
  email: string;
  phone: string;
  address: string;
  type: "buyer" | "seller" | "both";
  pan_number: string;
  aadhar_number: string;
  pan_file?: FileList;
  aadhar_file?: FileList;
};

export default function EditCustomerPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const customerId = searchParams.get("id");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      type: "buyer",
    },
  });

  /* ================= FETCH CUSTOMER ================= */
  useEffect(() => {
    if (!customerId) return;
    fetchCustomer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      const res = await axiosInstance.get(
        `${ProjectApi.all_customers}/${customerId}`
      );

      const data = res.data?.data;
      if (!data) return;

      setValue("name", data.name || "");
      setValue("email", data.email || "");
      setValue("phone", data.phone || "");
      setValue("address", data.address || "");
      setValue("type", data.type?.toLowerCase() || "buyer");
      setValue("pan_number", data.pan_number || "");
      setValue("aadhar_number", data.aadhar_number || "");
    } catch (error) {
      console.error("Failed to load customer", error);
    }
  };

  /* ================= UPDATE CUSTOMER ================= */
  const onSubmit = async (values: FormValues) => {
    try {
      const formData = new FormData();

      // Laravel PUT spoofing
      formData.append("_method", "PUT");

      formData.append("name", values.name);
      formData.append("email", values.email);
      formData.append("phone", values.phone);
      formData.append("address", values.address);
      formData.append("type", values.type.toUpperCase());
      formData.append("pan_number", values.pan_number);
      formData.append("aadhar_number", values.aadhar_number);

      if (values.pan_file?.[0]) {
        formData.append("pan_file_path", values.pan_file[0]);
      }

      if (values.aadhar_file?.[0]) {
        formData.append("aadhar_file_path", values.aadhar_file[0]);
      }

      await axiosInstance.post(
        `${ProjectApi.all_customers}/${customerId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      router.push(`/customers/view?id=${customerId}`);
    } catch (error) {
      console.error("Failed to update customer", error);
      alert("Failed to update customer");
    }
  };

  const inputClass =
    "w-full px-3 py-2 rounded-md border border-gray-300 " +
    "focus:outline-none focus:ring-2 focus:ring-[#0070BB] focus:border-[#0070BB]";

  return (
    <div className="min-h-screen flex justify-center pt-12 px-4 text-black bg-gray-50">
      <div className="w-full max-w-2xl">
        {/* HEADER */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-800 mt-2 text-center">
            Edit Customer
          </h1>
        </div>

        {/* FORM */}
        <div className="bg-white rounded-2xl shadow-md p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-sm">
            {/* Name */}
            <div>
              <label className="block font-medium mb-1">Name</label>
              <input {...register("name", { required: true })} className={inputClass} />
            </div>

            {/* Email */}
            <div>
              <label className="block font-medium mb-1">Email</label>
              <input
                type="email"
                {...register("email", { required: true })}
                className={inputClass}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block font-medium mb-1">Phone</label>
              <input {...register("phone", { required: true })} className={inputClass} />
            </div>

            {/* Address */}
            <div>
              <label className="block font-medium mb-1">Address</label>
              <textarea
                rows={3}
                {...register("address")}
                className={inputClass}
              />
            </div>

            {/* Type */}
            <div>
              <label className="block font-medium mb-1">Customer Type</label>
              <select {...register("type")} className={inputClass}>
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
                <option value="both">Both</option>
              </select>
            </div>

            {/* PAN */}
            <div>
              <label className="block font-medium mb-1">PAN Number</label>
              <input {...register("pan_number")} className={inputClass} />
            </div>

            <div>
              <label className="block font-medium mb-1">
                PAN File (optional)
              </label>
              <input type="file" {...register("pan_file")} />
            </div>

            {/* Aadhaar */}
            <div>
              <label className="block font-medium mb-1">Aadhaar Number</label>
              <input {...register("aadhar_number")} className={inputClass} />
            </div>

            <div>
              <label className="block font-medium mb-1">
                Aadhaar File (optional)
              </label>
              <input type="file" {...register("aadhar_file")} />
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 justify-end">
              <Link
                href={`/customers/view?id=${customerId}`}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#0070BB] text-white rounded-md text-sm font-medium hover:bg-[#005A99]"
              >
                {isSubmitting ? "Updating..." : "Update Customer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}